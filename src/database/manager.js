// Gestor de base de datos SQLite optimizado para Raspberry Pi
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    this.dbPath = path.join(__dirname, '../../data/domoticx.db');
    this.db = null;
    this.init();
  }

  init() {
    // Crear directorio si no existe
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Conectar a SQLite
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error conectando a SQLite:', err.message);
      } else {
        console.log('Conectado a SQLite en:', this.dbPath);
        this.setupDatabase();
      }
    });

    // Configuraciones optimizadas para Raspberry Pi
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
      }
    });
  }

  // Métodos para nodos
  async insertarNodo(nodo) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO nodos (nombre, tipo, mac_address, ip_address, ubicacion) 
                   VALUES (?, ?, ?, ?, ?)`;
      this.db.run(sql, [nodo.nombre, nodo.tipo, nodo.mac_address, nodo.ip_address, nodo.ubicacion], 
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  async obtenerNodos() {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM nodos ORDER BY nombre", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
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

  // Métodos para sensores
  async insertarSensor(sensor) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO sensores (nodo_id, nombre, tipo, pin, unidad, min_valor, max_valor) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;
      this.db.run(sql, [sensor.nodo_id, sensor.nombre, sensor.tipo, sensor.pin, 
                       sensor.unidad, sensor.min_valor, sensor.max_valor], 
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  async obtenerSensoresPorNodo(nodoId) {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM sensores WHERE nodo_id = ? AND activo = 1", [nodoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Métodos para lecturas (optimizado para no sobrecargar Raspberry Pi)
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

  // Métodos para actuadores
  async insertarActuador(actuador) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO actuadores (nodo_id, nombre, tipo, pin, configuracion) 
                   VALUES (?, ?, ?, ?, ?)`;
      this.db.run(sql, [actuador.nodo_id, actuador.nombre, actuador.tipo, 
                       actuador.pin, JSON.stringify(actuador.configuracion)], 
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  async obtenerActuadoresPorNodo(nodoId) {
    return new Promise((resolve, reject) => {
      this.db.all("SELECT * FROM actuadores WHERE nodo_id = ? AND activo = 1", [nodoId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async actualizarSensor(id, sensor) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE sensores SET nombre = ?, tipo = ?, pin = ?, unidad = ?, 
                   min_valor = ?, max_valor = ?, calibracion = ?, configuracion = ?
                   WHERE id = ?`;
      this.db.run(sql, [sensor.nombre, sensor.tipo, sensor.pin, sensor.unidad,
                       sensor.min_valor, sensor.max_valor, sensor.calibracion, 
                       sensor.configuracion, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarSensor(id) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE sensores SET activo = 0 WHERE id = ?";
      this.db.run(sql, [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async actualizarActuador(id, actuador) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE actuadores SET nombre = ?, tipo = ?, pin = ?, configuracion = ?
                   WHERE id = ?`;
      this.db.run(sql, [actuador.nombre, actuador.tipo, actuador.pin,
                       JSON.stringify(actuador.configuracion), id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async eliminarActuador(id) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE actuadores SET activo = 0 WHERE id = ?";
      this.db.run(sql, [id], function(err) {
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

  // Limpieza automática para mantener el rendimiento en Raspberry Pi
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

  // Método para logs
  async insertarLog(nivel, modulo, mensaje, detalles = null) {
    return new Promise((resolve, reject) => {
      const sql = "INSERT INTO logs_sistema (nivel, modulo, mensaje, detalles) VALUES (?, ?, ?, ?)";
      this.db.run(sql, [nivel, modulo, mensaje, detalles ? JSON.stringify(detalles) : null], 
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
    });
  }

  // Métodos para nodos
  async obtenerNodoPorId(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM nodos WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async actualizarConfiguracionNodo(id, configuracion) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE nodos SET configuracion = ?, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?";
      this.db.run(sql, [configuracion, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async actualizarIPNodo(id, ipAddress) {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE nodos SET ip_address = ?, ultimo_ping = CURRENT_TIMESTAMP, actualizado_en = CURRENT_TIMESTAMP WHERE id = ?";
      this.db.run(sql, [ipAddress, id], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async obtenerConfiguracionWiFiNodo(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT configuracion FROM nodos WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else {
          try {
            const config = row && row.configuracion ? JSON.parse(row.configuracion) : {};
            resolve(config.wifi || null);
          } catch (parseErr) {
            resolve(null);
          }
        }
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

// Singleton para uso global
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

module.exports = { getDatabase, DatabaseManager };