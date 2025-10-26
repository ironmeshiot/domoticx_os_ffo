// Gestor de base de datos SQLite optimizado para Raspberry Pi con CRUD completo
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const ESTADO_POR_DEFECTO = 'offline';

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/domoticx.db');
    this.db = null;
    this.init();
  }

  init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error conectando a SQLite:', err.message);
      } else {
        console.log('Conectado a SQLite en:', this.dbPath);
        this.setupDatabase();
      }
    });

    this.db.serialize(() => {
      this.db.run("PRAGMA journal_mode = WAL");
      this.db.run("PRAGMA synchronous = NORMAL");
      this.db.run("PRAGMA cache_size = 1000");
      this.db.run("PRAGMA temp_store = MEMORY");
    });
  }

  setupDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    this.db.exec(schema, (err) => {
      if (err) {
        console.error('Error creando esquema:', err.message);
      } else {
        console.log('Base de datos inicializada correctamente');
        this.aplicarMigraciones();
      }
    });
  }

  aplicarMigraciones() {
    this.ensureColumn('sensores', 'configuracion', "JSON");
    
    // Aplicar migración a nuevo modelo de definiciones/asignaciones
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='sensores_definiciones'", (err, row) => {
      if (err) {
        console.error('Error verificando tablas:', err.message);
        return;
      }
      
      if (!row) {
        console.log('Aplicando migración: modelo de definiciones y asignaciones...');
        const migracionPath = path.join(__dirname, 'migracion_definiciones.sql');
        
        if (fs.existsSync(migracionPath)) {
          const migracionSQL = fs.readFileSync(migracionPath, 'utf8');
          this.db.exec(migracionSQL, (execErr) => {
            if (execErr) {
              console.error('Error ejecutando migración:', execErr.message);
            } else {
              console.log('✓ Migración completada: modelo de definiciones y asignaciones aplicado');
            }
          });
        } else {
          console.warn('Archivo de migración no encontrado:', migracionPath);
        }
      }
    });
  }

  ensureColumn(tabla, columna, declaracionTipo) {
    const sqlInfo = `PRAGMA table_info(${tabla})`;
    this.db.all(sqlInfo, (err, rows) => {
      if (err) {
        console.error(`No se pudo inspeccionar la tabla ${tabla}:`, err.message);
        return;
      }

      const existe = rows.some((row) => row.name === columna);
      if (!existe) {
        const alterSql = `ALTER TABLE ${tabla} ADD COLUMN ${columna} ${declaracionTipo}`;
        this.db.run(alterSql, (alterErr) => {
          if (alterErr) {
            if (alterErr.message.includes('duplicate column name')) {
              return;
            }
            console.error(`No se pudo agregar columna ${columna} a ${tabla}:`, alterErr.message);
          } else {
            console.log(`Columna ${columna} agregada a ${tabla}`);
          }
        });
      }
    });
  }

  ensureColumn(tabla, columna, definicion) {
    this.db.all(`PRAGMA table_info(${tabla})`, (err, rows) => {
      if (err) {
        console.error(`Error consultando esquema de ${tabla}:`, err.message);
        return;
      }

      const existe = rows.some((row) => row.name === columna);
      if (!existe) {
        this.db.run(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`, (alterErr) => {
          if (alterErr) {
            console.error(`No se pudo agregar la columna ${columna} a ${tabla}:`, alterErr.message);
          } else {
            console.log(`Columna ${columna} agregada a ${tabla}`);
          }
        });
      }
    });
  }

  // Utilidades ------------------------------------------------------------
  parseJSON(value, fallback = null) {
    if (!value) return fallback;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      console.warn('Error parseando JSON desde la base de datos:', error.message);
      return fallback;
    }
  }

  mapearNodo(row) {
    const configuracion = this.parseJSON(row?.configuracion, {});
    return {
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      macAddress: row.mac_address,
      ipAddress: row.ip_address,
      ubicacion: row.ubicacion,
      firmwareVersion: row.firmware_version,
      estado: row.estado,
      ultimoPing: row.ultimo_ping,
      descripcion: configuracion?.descripcion || '',
      tags: configuracion?.tags || [],
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en
    };
  }

  mapearSensor(row) {
    return {
      id: row.id,
      nodoId: row.nodo_id,
      nombre: row.nombre,
      tipo: row.tipo,
      pin: row.pin,
      unidad: row.unidad,
      minValor: row.min_valor,
      maxValor: row.max_valor,
      calibracion: this.parseJSON(row.calibracion, {}),
      configuracion: this.parseJSON(row.configuracion, {}),
      activo: row.activo === 1,
      creadoEn: row.creado_en
    };
  }

  mapearActuador(row) {
    return {
      id: row.id,
      nodoId: row.nodo_id,
      nombre: row.nombre,
      tipo: row.tipo,
      pin: row.pin,
      configuracion: this.parseJSON(row.configuracion, {}),
      estado: this.parseJSON(row.estado_actual, null),
      activo: row.activo === 1,
      creadoEn: row.creado_en
    };
  }

  // Nodos -----------------------------------------------------------------
  async insertarNodo(nodo) {
    return new Promise((resolve, reject) => {
      const metadata = {
        descripcion: nodo.descripcion || '',
        tags: Array.isArray(nodo.tags) ? nodo.tags : []
      };

      const sql = `INSERT INTO nodos (nombre, tipo, mac_address, ip_address, ubicacion, firmware_version, estado, configuracion)
                   VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, ?), ?)`;
      this.db.run(sql, [
        nodo.nombre,
        nodo.tipo,
        nodo.mac_address || nodo.macAddress || null,
        nodo.ip_address || nodo.ipAddress || null,
        nodo.ubicacion || null,
        nodo.firmware_version || nodo.firmwareVersion || null,
        nodo.estado || ESTADO_POR_DEFECTO,
        ESTADO_POR_DEFECTO,
        JSON.stringify(metadata)
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerNodos() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM nodos ORDER BY nombre", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearNodo(row)));
      });
    });
  }

  async obtenerNodoPorId(id) {
    return new Promise((resolve, reject) => {
      // Obtener datos básicos del nodo
      this.db.get("SELECT * FROM nodos WHERE id = ?", [id], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
          return;
        }

        try {
          // Obtener configuración WiFi si existe
          const wifiConfig = await this.obtenerConfiguracionWiFiNodo(id);
          const nodo = this.mapearNodo(row);
          
          // Agregar configuración WiFi al nodo
          if (wifiConfig) {
            nodo.ssid = wifiConfig.ssid;
            nodo.wifiPass = wifiConfig.password;
            nodo.canal = wifiConfig.canal;
            nodo.failover = wifiConfig.modo_red;
            // Campos extendidos de red
            nodo.tipoIP = wifiConfig.tipoIP || null;
            nodo.ipFija = wifiConfig.ipFija || null;
            nodo.mascara = wifiConfig.mascara || null;
            nodo.gateway = wifiConfig.gateway || null;
            nodo.dns = wifiConfig.dns || null;
            nodo.frecuenciaLora = wifiConfig.frecuenciaLora || null;
            nodo.canalLora = wifiConfig.canalLora || null;
            nodo.potenciaLora = wifiConfig.potenciaLora || null;
          }
          
          resolve(nodo);
        } catch (error) {
          // Si hay error obteniendo WiFi config, devolver solo el nodo básico
          resolve(this.mapearNodo(row));
        }
      });
    });
  }

  async actualizarNodo(id, nodo) {
    return new Promise((resolve, reject) => {
      const metadata = {
        descripcion: nodo.descripcion || '',
        tags: Array.isArray(nodo.tags) ? nodo.tags : []
      };

      const sql = `UPDATE nodos
                   SET nombre = ?, tipo = ?, mac_address = ?, ip_address = ?, ubicacion = ?,
                       firmware_version = ?, estado = COALESCE(?, estado), configuracion = ?,
                       actualizado_en = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      this.db.run(sql, [
        nodo.nombre,
        nodo.tipo,
        nodo.mac_address || nodo.macAddress || null,
        nodo.ip_address || nodo.ipAddress || null,
        nodo.ubicacion || null,
        nodo.firmware_version || nodo.firmwareVersion || null,
        nodo.estado || null,
        JSON.stringify(metadata),
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarNodo(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM nodos WHERE id = ?", [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async actualizarEstadoNodo(id, estado) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE nodos SET estado = ?, ultimo_ping = CURRENT_TIMESTAMP WHERE id = ?";
      this.db.run(sql, [estado, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Configuración WiFi para nodos
  async obtenerConfiguracionWiFiNodo(nodoId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT ssid, password, canal, modo_red, extra FROM configuracion_wifi WHERE nodo_id = ?`;
      this.db.get(sql, [nodoId], (err, row) => {
        if (err) reject(err);
        if (!row) return resolve(null);
        let extra = {};
        try {
          extra = row.extra ? JSON.parse(row.extra) : {};
        } catch (e) { extra = {}; }
        resolve({
          ssid: row.ssid,
          password: row.password,
          canal: row.canal,
          modo_red: row.modo_red,
          ...extra
        });
      });
    });
  }

  async actualizarConfiguracionNodo(nodoId, configuracion) {
    return new Promise((resolve, reject) => {
      // Guardar campos extendidos como JSON
      const extra = {
        tipoIP: configuracion.tipoIP || null,
        ipFija: configuracion.ipFija || null,
        mascara: configuracion.mascara || null,
        gateway: configuracion.gateway || null,
        dns: configuracion.dns || null,
        frecuenciaLora: configuracion.frecuenciaLora || null,
        canalLora: configuracion.canalLora || null,
        potenciaLora: configuracion.potenciaLora || null
      };
      const sql = `INSERT OR REPLACE INTO configuracion_wifi 
                   (nodo_id, ssid, password, canal, modo_red, actualizado_en, extra)
                   VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`;
      this.db.run(sql, [
        nodoId,
        configuracion.ssid || null,
        configuracion.password || null,
        configuracion.canal || null,
        configuracion.modo_red || 'wifi',
        JSON.stringify(extra)
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Sensores --------------------------------------------------------------
  async insertarSensor(sensor) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO sensores
                   (nodo_id, nombre, tipo, pin, unidad, min_valor, max_valor, calibracion, configuracion, activo)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        sensor.nodo_id || sensor.nodoId,
        sensor.nombre,
        sensor.tipo,
        sensor.pin,
        sensor.unidad,
        sensor.min_valor ?? sensor.minValor,
        sensor.max_valor ?? sensor.maxValor,
        JSON.stringify(sensor.calibracion || {}),
        JSON.stringify(sensor.configuracion || {}),
        sensor.activo === false ? 0 : 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerSensoresPorNodo(nodoId) {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM sensores WHERE nodo_id = ? AND activo = 1", [nodoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearSensor(row)));
      });
    });
  }

  async obtenerTodosLosSensores() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT s.*, n.nombre as nodo_nombre 
                   FROM sensores s 
                   LEFT JOIN nodos n ON s.nodo_id = n.id 
                   WHERE s.activo = 1
                   ORDER BY n.nombre, s.nombre`;
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => ({
          ...this.mapearSensor(row),
          nodoNombre: row.nodo_nombre
        })));
      });
    });
  }

  async actualizarSensor(id, sensor) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE sensores
                   SET nombre = ?, tipo = ?, pin = ?, unidad = ?,
                       min_valor = ?, max_valor = ?, calibracion = ?, configuracion = ?, activo = ?
                   WHERE id = ?`;
      this.db.run(sql, [
        sensor.nombre,
        sensor.tipo,
        sensor.pin,
        sensor.unidad,
        sensor.min_valor ?? sensor.minValor,
        sensor.max_valor ?? sensor.maxValor,
        JSON.stringify(sensor.calibracion || {}),
        JSON.stringify(sensor.configuracion || {}),
        sensor.activo === false ? 0 : 1,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarSensor(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM sensores WHERE id = ?", [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Lecturas --------------------------------------------------------------
  async insertarLectura(sensorId, valor) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO lecturas_sensores (sensor_id, valor) VALUES (?, ?)";
      this.db.run(sql, [sensorId, valor], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerLecturasRecientes(sensorId, limite = 100) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM lecturas_sensores
                   WHERE sensor_id = ?
                   ORDER BY timestamp DESC
                   LIMIT ?`;
      this.db.all(sql, [sensorId, limite], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Actuadores ------------------------------------------------------------
  async insertarActuador(actuador) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO actuadores (nodo_id, nombre, tipo, pin, estado_actual, configuracion, activo)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        actuador.nodo_id || actuador.nodoId,
        actuador.nombre,
        actuador.tipo,
        actuador.pin,
        JSON.stringify(actuador.estado_actual || actuador.estado || null),
        JSON.stringify(actuador.configuracion || {}),
        actuador.activo === false ? 0 : 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerActuadoresPorNodo(nodoId) {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM actuadores WHERE nodo_id = ? AND activo = 1", [nodoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearActuador(row)));
      });
    });
  }

  async obtenerTodosLosActuadores() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT a.*, n.nombre as nodo_nombre 
                   FROM actuadores a 
                   LEFT JOIN nodos n ON a.nodo_id = n.id 
                   WHERE a.activo = 1
                   ORDER BY n.nombre, a.nombre`;
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => ({
          ...this.mapearActuador(row),
          nodoNombre: row.nodo_nombre
        })));
      });
    });
  }

  async actualizarActuador(id, actuador) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE actuadores
                   SET nombre = ?, tipo = ?, pin = ?, estado_actual = ?, configuracion = ?, activo = ?
                   WHERE id = ?`;
      this.db.run(sql, [
        actuador.nombre,
        actuador.tipo,
        actuador.pin,
        JSON.stringify(actuador.estado_actual || actuador.estado || null),
        JSON.stringify(actuador.configuracion || {}),
        actuador.activo === false ? 0 : 1,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarActuador(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM actuadores WHERE id = ?", [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async enviarComandoActuador(actuadorId, comando) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO comandos_actuadores (actuador_id, comando) VALUES (?, ?)";
      this.db.run(sql, [actuadorId, JSON.stringify(comando)], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // ========================================================================
  // DEFINICIONES DE SENSORES (Biblioteca Técnica)
  // ========================================================================

  mapearDefinicionSensor(row) {
    return {
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      modelo: row.modelo,
      fabricante: row.fabricante,
      protocolo: row.protocolo,
      voltajeMin: row.voltaje_min,
      voltajeMax: row.voltaje_max,
      pinesRequeridos: row.pines_requeridos,
      tipoPin: row.tipo_pin,
      unidad: row.unidad,
      minValor: row.min_valor,
      maxValor: row.max_valor,
      precisionValor: row.precision_valor,
      tiempoLecturaMs: row.tiempo_lectura_ms,
      calibracionDefault: this.parseJSON(row.calibracion_default, {}),
      configuracionDefault: this.parseJSON(row.configuracion_default, {}),
      especificaciones: this.parseJSON(row.especificaciones, {}),
      notas: row.notas,
      datasheetUrl: row.datasheet_url,
      activo: row.activo === 1,
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en
    };
  }

  async insertarDefinicionSensor(def) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO sensores_definiciones
                   (nombre, tipo, modelo, fabricante, protocolo, voltaje_min, voltaje_max,
                    pines_requeridos, tipo_pin, unidad, min_valor, max_valor, precision_valor,
                    tiempo_lectura_ms, calibracion_default, configuracion_default, especificaciones,
                    notas, datasheet_url, activo)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        def.nombre,
        def.tipo,
        def.modelo || null,
        def.fabricante || null,
        def.protocolo || null,
        def.voltajeMin ?? def.voltaje_min ?? null,
        def.voltajeMax ?? def.voltaje_max ?? null,
        def.pinesRequeridos ?? def.pines_requeridos ?? 1,
        def.tipoPin ?? def.tipo_pin ?? 'digital',
        def.unidad || null,
        def.minValor ?? def.min_valor ?? null,
        def.maxValor ?? def.max_valor ?? null,
        def.precisionValor ?? def.precision_valor ?? null,
        def.tiempoLecturaMs ?? def.tiempo_lectura_ms ?? null,
        JSON.stringify(def.calibracionDefault || def.calibracion_default || {}),
        JSON.stringify(def.configuracionDefault || def.configuracion_default || {}),
        JSON.stringify(def.especificaciones || {}),
        def.notas || null,
        def.datasheetUrl || def.datasheet_url || null,
        def.activo === false ? 0 : 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerDefinicionesSensores() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM sensores_definiciones WHERE activo = 1 ORDER BY nombre", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearDefinicionSensor(row)));
      });
    });
  }

  async obtenerDefinicionSensorPorId(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM sensores_definiciones WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? this.mapearDefinicionSensor(row) : null);
      });
    });
  }

  async actualizarDefinicionSensor(id, def) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE sensores_definiciones
                   SET nombre = ?, tipo = ?, modelo = ?, fabricante = ?, protocolo = ?,
                       voltaje_min = ?, voltaje_max = ?, pines_requeridos = ?, tipo_pin = ?,
                       unidad = ?, min_valor = ?, max_valor = ?, precision_valor = ?,
                       tiempo_lectura_ms = ?, calibracion_default = ?, configuracion_default = ?,
                       especificaciones = ?, notas = ?, datasheet_url = ?, activo = ?,
                       actualizado_en = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      this.db.run(sql, [
        def.nombre,
        def.tipo,
        def.modelo || null,
        def.fabricante || null,
        def.protocolo || null,
        def.voltajeMin ?? def.voltaje_min ?? null,
        def.voltajeMax ?? def.voltaje_max ?? null,
        def.pinesRequeridos ?? def.pines_requeridos ?? 1,
        def.tipoPin ?? def.tipo_pin ?? 'digital',
        def.unidad || null,
        def.minValor ?? def.min_valor ?? null,
        def.maxValor ?? def.max_valor ?? null,
        def.precisionValor ?? def.precision_valor ?? null,
        def.tiempoLecturaMs ?? def.tiempo_lectura_ms ?? null,
        JSON.stringify(def.calibracionDefault || def.calibracion_default || {}),
        JSON.stringify(def.configuracionDefault || def.configuracion_default || {}),
        JSON.stringify(def.especificaciones || {}),
        def.notas || null,
        def.datasheetUrl || def.datasheet_url || null,
        def.activo === false ? 0 : 1,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarDefinicionSensor(id) {
    return new Promise((resolve, reject) => {
      // Verificar que no haya asignaciones activas antes de eliminar
      this.db.get("SELECT COUNT(*) as count FROM sensor_asignaciones WHERE definicion_id = ? AND activo = 1", [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row.count > 0) {
          reject(new Error('No se puede eliminar: existen asignaciones activas'));
        } else {
          this.db.run("DELETE FROM sensores_definiciones WHERE id = ?", [id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          });
        }
      });
    });
  }

  // ========================================================================
  // ASIGNACIONES DE SENSORES (Instancias Físicas)
  // ========================================================================

  mapearAsignacionSensor(row) {
    return {
      id: row.id,
      definicionId: row.definicion_id,
      nodoId: row.nodo_id,
      pin: row.pin,
      alias: row.alias,
      ubicacionEspecifica: row.ubicacion_especifica,
      calibracion: this.parseJSON(row.calibracion, {}),
      configuracion: this.parseJSON(row.configuracion, {}),
      fechaInstalacion: row.fecha_instalacion,
      activo: row.activo === 1,
      ultimaLectura: row.ultima_lectura,
      notas: row.notas,
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en,
      // Campos JOIN si existen
      definicionNombre: row.definicion_nombre,
      nodoNombre: row.nodo_nombre
    };
  }

  async insertarAsignacionSensor(asig) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO sensor_asignaciones
                   (definicion_id, nodo_id, pin, alias, ubicacion_especifica, calibracion,
                    configuracion, fecha_instalacion, activo, notas)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        asig.definicionId || asig.definicion_id,
        asig.nodoId || asig.nodo_id,
        asig.pin,
        asig.alias,
        asig.ubicacionEspecifica || asig.ubicacion_especifica || null,
        JSON.stringify(asig.calibracion || {}),
        JSON.stringify(asig.configuracion || {}),
        asig.fechaInstalacion || asig.fecha_instalacion || null,
        asig.activo === false ? 0 : 1,
        asig.notas || null
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerAsignacionesSensoresPorNodo(nodoId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT sa.*, sd.nombre as definicion_nombre
                   FROM sensor_asignaciones sa
                   LEFT JOIN sensores_definiciones sd ON sa.definicion_id = sd.id
                   WHERE sa.nodo_id = ? AND sa.activo = 1
                   ORDER BY sa.pin`;
      this.db.all(sql, [nodoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearAsignacionSensor(row)));
      });
    });
  }

  async obtenerTodasLasAsignacionesSensores() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT sa.*, sd.nombre as definicion_nombre, n.nombre as nodo_nombre
                   FROM sensor_asignaciones sa
                   LEFT JOIN sensores_definiciones sd ON sa.definicion_id = sd.id
                   LEFT JOIN nodos n ON sa.nodo_id = n.id
                   WHERE sa.activo = 1
                   ORDER BY n.nombre, sa.pin`;
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearAsignacionSensor(row)));
      });
    });
  }

  async actualizarAsignacionSensor(id, asig) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE sensor_asignaciones
                   SET pin = ?, alias = ?, ubicacion_especifica = ?, calibracion = ?,
                       configuracion = ?, activo = ?, notas = ?,
                       actualizado_en = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      this.db.run(sql, [
        asig.pin,
        asig.alias,
        asig.ubicacionEspecifica || asig.ubicacion_especifica || null,
        JSON.stringify(asig.calibracion || {}),
        JSON.stringify(asig.configuracion || {}),
        asig.activo === false ? 0 : 1,
        asig.notas || null,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarAsignacionSensor(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM sensor_asignaciones WHERE id = ?", [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // ========================================================================
  // DEFINICIONES DE ACTUADORES (Biblioteca Técnica)
  // ========================================================================

  mapearDefinicionActuador(row) {
    return {
      id: row.id,
      nombre: row.nombre,
      tipo: row.tipo,
      modelo: row.modelo,
      fabricante: row.fabricante,
      protocolo: row.protocolo,
      voltajeMin: row.voltaje_min,
      voltajeMax: row.voltaje_max,
      corrienteMax: row.corriente_max,
      potenciaMax: row.potencia_max,
      pinesRequeridos: row.pines_requeridos,
      tipoPin: row.tipo_pin,
      rangoControlMin: row.rango_control_min,
      rangoControlMax: row.rango_control_max,
      tiempoRespuestaMs: row.tiempo_respuesta_ms,
      configuracionDefault: this.parseJSON(row.configuracion_default, {}),
      especificaciones: this.parseJSON(row.especificaciones, {}),
      notas: row.notas,
      datasheetUrl: row.datasheet_url,
      activo: row.activo === 1,
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en
    };
  }

  async insertarDefinicionActuador(def) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO actuadores_definiciones
                   (nombre, tipo, modelo, fabricante, protocolo, voltaje_min, voltaje_max,
                    corriente_max, potencia_max, pines_requeridos, tipo_pin, rango_control_min,
                    rango_control_max, tiempo_respuesta_ms, configuracion_default,
                    especificaciones, notas, datasheet_url, activo)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        def.nombre,
        def.tipo,
        def.modelo || null,
        def.fabricante || null,
        def.protocolo || null,
        def.voltajeMin ?? def.voltaje_min ?? null,
        def.voltajeMax ?? def.voltaje_max ?? null,
        def.corrienteMax ?? def.corriente_max ?? null,
        def.potenciaMax ?? def.potencia_max ?? null,
        def.pinesRequeridos ?? def.pines_requeridos ?? 1,
        def.tipoPin ?? def.tipo_pin ?? 'digital',
        def.rangoControlMin ?? def.rango_control_min ?? null,
        def.rangoControlMax ?? def.rango_control_max ?? null,
        def.tiempoRespuestaMs ?? def.tiempo_respuesta_ms ?? null,
        JSON.stringify(def.configuracionDefault || def.configuracion_default || {}),
        JSON.stringify(def.especificaciones || {}),
        def.notas || null,
        def.datasheetUrl || def.datasheet_url || null,
        def.activo === false ? 0 : 1
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerDefinicionesActuadores() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM actuadores_definiciones WHERE activo = 1 ORDER BY nombre", (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearDefinicionActuador(row)));
      });
    });
  }

  async obtenerDefinicionActuadorPorId(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM actuadores_definiciones WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row ? this.mapearDefinicionActuador(row) : null);
      });
    });
  }

  async actualizarDefinicionActuador(id, def) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE actuadores_definiciones
                   SET nombre = ?, tipo = ?, modelo = ?, fabricante = ?, protocolo = ?,
                       voltaje_min = ?, voltaje_max = ?, corriente_max = ?, potencia_max = ?,
                       pines_requeridos = ?, tipo_pin = ?, rango_control_min = ?,
                       rango_control_max = ?, tiempo_respuesta_ms = ?, configuracion_default = ?,
                       especificaciones = ?, notas = ?, datasheet_url = ?, activo = ?,
                       actualizado_en = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      this.db.run(sql, [
        def.nombre,
        def.tipo,
        def.modelo || null,
        def.fabricante || null,
        def.protocolo || null,
        def.voltajeMin ?? def.voltaje_min ?? null,
        def.voltajeMax ?? def.voltaje_max ?? null,
        def.corrienteMax ?? def.corriente_max ?? null,
        def.potenciaMax ?? def.potencia_max ?? null,
        def.pinesRequeridos ?? def.pines_requeridos ?? 1,
        def.tipoPin ?? def.tipo_pin ?? 'digital',
        def.rangoControlMin ?? def.rango_control_min ?? null,
        def.rangoControlMax ?? def.rango_control_max ?? null,
        def.tiempoRespuestaMs ?? def.tiempo_respuesta_ms ?? null,
        JSON.stringify(def.configuracionDefault || def.configuracion_default || {}),
        JSON.stringify(def.especificaciones || {}),
        def.notas || null,
        def.datasheetUrl || def.datasheet_url || null,
        def.activo === false ? 0 : 1,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarDefinicionActuador(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT COUNT(*) as count FROM actuador_asignaciones WHERE definicion_id = ? AND activo = 1", [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row.count > 0) {
          reject(new Error('No se puede eliminar: existen asignaciones activas'));
        } else {
          this.db.run("DELETE FROM actuadores_definiciones WHERE id = ?", [id], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
          });
        }
      });
    });
  }

  // ========================================================================
  // ASIGNACIONES DE ACTUADORES (Instancias Físicas)
  // ========================================================================

  mapearAsignacionActuador(row) {
    return {
      id: row.id,
      definicionId: row.definicion_id,
      nodoId: row.nodo_id,
      pin: row.pin,
      alias: row.alias,
      ubicacionEspecifica: row.ubicacion_especifica,
      configuracion: this.parseJSON(row.configuracion, {}),
      estadoActual: this.parseJSON(row.estado_actual, null),
      fechaInstalacion: row.fecha_instalacion,
      activo: row.activo === 1,
      ultimaActivacion: row.ultima_activacion,
      notas: row.notas,
      creadoEn: row.creado_en,
      actualizadoEn: row.actualizado_en,
      definicionNombre: row.definicion_nombre,
      nodoNombre: row.nodo_nombre
    };
  }

  async insertarAsignacionActuador(asig) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO actuador_asignaciones
                   (definicion_id, nodo_id, pin, alias, ubicacion_especifica, configuracion,
                    estado_actual, fecha_instalacion, activo, notas)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [
        asig.definicionId || asig.definicion_id,
        asig.nodoId || asig.nodo_id,
        asig.pin,
        asig.alias,
        asig.ubicacionEspecifica || asig.ubicacion_especifica || null,
        JSON.stringify(asig.configuracion || {}),
        JSON.stringify(asig.estadoActual || asig.estado_actual || null),
        asig.fechaInstalacion || asig.fecha_instalacion || null,
        asig.activo === false ? 0 : 1,
        asig.notas || null
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async obtenerAsignacionesActuadoresPorNodo(nodoId) {
    return new Promise((resolve, reject) => {
      const sql = `SELECT aa.*, ad.nombre as definicion_nombre
                   FROM actuador_asignaciones aa
                   LEFT JOIN actuadores_definiciones ad ON aa.definicion_id = ad.id
                   WHERE aa.nodo_id = ? AND aa.activo = 1
                   ORDER BY aa.pin`;
      this.db.all(sql, [nodoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearAsignacionActuador(row)));
      });
    });
  }

  async obtenerTodasLasAsignacionesActuadores() {
    return new Promise((resolve, reject) => {
      const sql = `SELECT aa.*, ad.nombre as definicion_nombre, n.nombre as nodo_nombre
                   FROM actuador_asignaciones aa
                   LEFT JOIN actuadores_definiciones ad ON aa.definicion_id = ad.id
                   LEFT JOIN nodos n ON aa.nodo_id = n.id
                   WHERE aa.activo = 1
                   ORDER BY n.nombre, aa.pin`;
      this.db.all(sql, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map((row) => this.mapearAsignacionActuador(row)));
      });
    });
  }

  async actualizarAsignacionActuador(id, asig) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE actuador_asignaciones
                   SET pin = ?, alias = ?, ubicacion_especifica = ?, configuracion = ?,
                       estado_actual = ?, activo = ?, notas = ?,
                       actualizado_en = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      this.db.run(sql, [
        asig.pin,
        asig.alias,
        asig.ubicacionEspecifica || asig.ubicacion_especifica || null,
        JSON.stringify(asig.configuracion || {}),
        JSON.stringify(asig.estadoActual || asig.estado_actual || null),
        asig.activo === false ? 0 : 1,
        asig.notas || null,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarAsignacionActuador(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM actuador_asignaciones WHERE id = ?", [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Mantenimiento ---------------------------------------------------------
  async limpiezaAutomatica() {
    const retentionDias = 30;
    const sql = `DELETE FROM lecturas_sensores
                 WHERE timestamp < datetime('now', '-${retentionDias} days')`;

    return new Promise((resolve, reject) => {
      this.db.run(sql, function(err) {
        if (err) reject(err);
        else {
          console.log(`Limpieza automática: ${this.changes} registros eliminados`);
          resolve(this.changes);
        }
      });
    });
  }

  async insertarLog(nivel, modulo, mensaje, detalles = null) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO logs_sistema (nivel, modulo, mensaje, detalles) VALUES (?, ?, ?, ?)";
      this.db.run(sql, [nivel, modulo, mensaje, detalles ? JSON.stringify(detalles) : null], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error cerrando base de datos:', err.message);
        } else {
          console.log('Conexión a base de datos cerrada');
        }
      });
    }
  }
}

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

module.exports = { getDatabase, DatabaseManager };