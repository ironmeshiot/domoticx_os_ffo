// Servidor Express principal para DomoticX OS FFO - Optimizado para Raspberry Pi 5
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { getDatabase } = require('../database/manager');
const MonitoreoTiempoReal = require('./monitoreo');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Headers para habilitar Web Serial API
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'serial=*');
  // Solo agregar COEP/COOP para rutas específicas si es necesario
  // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  // res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Inicializar base de datos
const db = getDatabase();

// Inicializar sistema de monitoreo en tiempo real
const monitoreo = new MonitoreoTiempoReal(server);

// APIs
console.log('Cargando módulos API...');
const widgetsApi = require('../api/widgets');
console.log('✓ widgets loaded');
const sensoresApi = require('../api/sensores');
console.log('✓ sensores loaded');
const actuadoresApi = require('../api/actuadores');
console.log('✓ actuadores loaded');
const sensoresDefinicionesApi = require('../api/sensores-definiciones');
console.log('✓ sensores-definiciones loaded');
const sensorAsignacionesApi = require('../api/sensor-asignaciones');
console.log('✓ sensor-asignaciones loaded');
const actuadoresDefinicionesApi = require('../api/actuadores-definiciones');
console.log('✓ actuadores-definiciones loaded');
const actuadorAsignacionesApi = require('../api/actuador-asignaciones');
console.log('✓ actuador-asignaciones loaded');
const generarFirmwareApi = require('../api/generar-firmware');
console.log('✓ generar-firmware loaded');

console.log('Registrando routers...');
app.use('/api/widgets', widgetsApi);
console.log('✓ /api/widgets registered');
app.use('/api', sensoresApi);
console.log('✓ sensores registered');
app.use('/api', actuadoresApi);
console.log('✓ actuadores registered');
app.use('/api/sensores-definiciones', sensoresDefinicionesApi);
console.log('✓ /api/sensores-definiciones registered');
app.use('/api/sensor-asignaciones', sensorAsignacionesApi);
console.log('✓ /api/sensor-asignaciones registered');
app.use('/api/actuadores-definiciones', actuadoresDefinicionesApi);
console.log('✓ /api/actuadores-definiciones registered');
app.use('/api/actuador-asignaciones', actuadorAsignacionesApi);
console.log('✓ /api/actuador-asignaciones registered');
app.use('/api', generarFirmwareApi);
console.log('✓ /api/generar-firmware registered');

// API para nodos
app.get('/api/nodos', async (req, res) => {
  try {
    console.log('GET /api/nodos - Iniciando...');
    console.log('db disponible:', !!db);
    console.log('db.obtenerNodos:', typeof db.obtenerNodos);
    const nodos = await db.obtenerNodos();
    console.log('Nodos obtenidos:', nodos.length);
    res.json(nodos);
  } catch (error) {
    console.error('ERROR en GET /api/nodos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nodos/:id', async (req, res) => {
  try {
    const nodo = await db.obtenerNodoPorId(req.params.id);
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    res.json(nodo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nodos', async (req, res) => {
  try {
    const id = await db.insertarNodo(req.body);
    const nodo = await db.obtenerNodoPorId(id);
    res.json({ id, nodo, mensaje: 'Nodo creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/nodos/:id', async (req, res) => {
  try {
    console.log('🔧 PUT /api/nodos/:id - Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    // Actualizar campos básicos del nodo
    const cambios = await db.actualizarNodo(req.params.id, req.body);
    if (!cambios) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    console.log('✅ Campos básicos actualizados');

    // Si hay configuración WiFi, también actualizarla
    if (req.body.ssid || req.body.wifiPass || req.body.canal || req.body.failover) {
      const wifiConfig = {
        ssid: req.body.ssid,
        password: req.body.wifiPass,
        canal: req.body.canal,
        modo_red: req.body.failover
      };
      console.log('📡 Guardando configuración WiFi:', JSON.stringify(wifiConfig, null, 2));
      await db.actualizarConfiguracionNodo(req.params.id, wifiConfig);
      console.log('✅ Configuración WiFi guardada');
    } else {
      console.log('⚠️ No hay configuración WiFi en el request');
    }

    const nodo = await db.obtenerNodoPorId(req.params.id);
    console.log('📄 Nodo final con WiFi:', `ssid=${nodo.ssid}, wifiPass=${nodo.wifiPass}`);
    res.json({ mensaje: 'Nodo actualizado exitosamente', nodo });
  } catch (error) {
    console.error('❌ Error en PUT /api/nodos/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/nodos/:id', async (req, res) => {
  try {
    const cambios = await db.eliminarNodo(req.params.id);
    if (!cambios) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    res.json({ mensaje: 'Nodo eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para sensores
app.get('/api/nodos/:id/sensores', async (req, res) => {
  try {
    const sensores = await db.obtenerSensoresPorNodo(req.params.id);
    res.json(sensores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sensores', async (req, res) => {
  try {
    const payload = {
      nodo_id: req.body.nodo_id || req.body.nodoId,
      nombre: req.body.nombre,
      tipo: req.body.tipo,
      pin: req.body.pin,
      unidad: req.body.unidad,
      min_valor: req.body.min_valor ?? req.body.minValor,
      max_valor: req.body.max_valor ?? req.body.maxValor,
      calibracion: req.body.calibracion,
      configuracion: req.body.configuracion,
      activo: req.body.activo
    };
    const id = await db.insertarSensor(payload);
    const sensores = await db.obtenerSensoresPorNodo(payload.nodo_id);
    const sensor = sensores.find((item) => item.id === id) || null;
    res.json({ id, sensor, mensaje: 'Sensor creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/sensores/:id', async (req, res) => {
  try {
    const payload = {
      nombre: req.body.nombre,
      tipo: req.body.tipo,
      pin: req.body.pin,
      unidad: req.body.unidad,
      min_valor: req.body.min_valor ?? req.body.minValor,
      max_valor: req.body.max_valor ?? req.body.maxValor,
      calibracion: req.body.calibracion,
      configuracion: req.body.configuracion,
      activo: req.body.activo
    };
    const cambios = await db.actualizarSensor(req.params.id, payload);
    if (!cambios) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }
    res.json({ mensaje: 'Sensor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sensores/:id', async (req, res) => {
  try {
    const cambios = await db.eliminarSensor(req.params.id);
    if (!cambios) {
      return res.status(404).json({ error: 'Sensor no encontrado' });
    }
    res.json({ mensaje: 'Sensor eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para lecturas de sensores
app.get('/api/sensores/:id/lecturas', async (req, res) => {
  try {
    const limite = req.query.limite || 100;
    const lecturas = await db.obtenerLecturasRecientes(req.params.id, limite);
    res.json(lecturas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para actuadores
app.post('/api/actuadores', async (req, res) => {
  try {
    const payload = {
      nodo_id: req.body.nodo_id || req.body.nodoId,
      nombre: req.body.nombre,
      tipo: req.body.tipo,
      pin: req.body.pin,
      configuracion: req.body.configuracion,
      estado: req.body.estado,
      estado_actual: req.body.estado_actual,
      activo: req.body.activo
    };
    const id = await db.insertarActuador(payload);
    const actuadores = await db.obtenerActuadoresPorNodo(payload.nodo_id);
    const actuador = actuadores.find((item) => item.id === id) || null;
    res.json({ id, actuador, mensaje: 'Actuador creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nodos/:id/actuadores', async (req, res) => {
  try {
    const actuadores = await db.obtenerActuadoresPorNodo(req.params.id);
    res.json(actuadores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/actuadores/:id', async (req, res) => {
  try {
    const payload = {
      nombre: req.body.nombre,
      tipo: req.body.tipo,
      pin: req.body.pin,
      configuracion: req.body.configuracion,
      estado: req.body.estado,
      estado_actual: req.body.estado_actual,
      activo: req.body.activo
    };
    const cambios = await db.actualizarActuador(req.params.id, payload);
    if (!cambios) {
      return res.status(404).json({ error: 'Actuador no encontrado' });
    }
    res.json({ mensaje: 'Actuador actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/actuadores/:id', async (req, res) => {
  try {
    const cambios = await db.eliminarActuador(req.params.id);
    if (!cambios) {
      return res.status(404).json({ error: 'Actuador no encontrado' });
    }
    res.json({ mensaje: 'Actuador eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/actuadores/:id/comando', async (req, res) => {
  try {
    const id = await db.enviarComandoActuador(req.params.id, req.body.comando);
    res.json({ id, mensaje: 'Comando enviado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir frontend (React build)
const buildPath = path.join(__dirname, '../../frontend/build');
console.log('🔍 Build path:', buildPath);
console.log('🔍 Build exists:', require('fs').existsSync(buildPath));

app.use(express.static(buildPath));

// Ruta catch-all para SPA - solo para rutas que no empiecen con /api
app.get(/^(?!\/api).*/, (req, res) => {
  console.log('🌐 Frontend route requested:', req.path);
  const indexPath = path.join(__dirname, '../../frontend/build/index.html');
  console.log('🔍 Index path:', indexPath);
  console.log('🔍 Index exists:', require('fs').existsSync(indexPath));
  
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<h1>DomoticX OS FFO</h1><p>Frontend en desarrollo. Accede a /api para las APIs.</p><p>Build path: ' + buildPath + '</p>');
  }
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor', mensaje: err.message });
});

// Capturar errores no manejados para evitar que el servidor se caiga
process.on('uncaughtException', (err) => {
  console.error('ERROR NO CAPTURADO:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('PROMESA NO MANEJADA rechazada en:', promise, 'razón:', reason);
});

const PORT = process.env.PORT || 4000;

// Esperar a que la base de datos esté lista antes de escuchar
setTimeout(() => {
  server.listen(PORT, () => {
    console.log(`Servidor DomoticX OS FFO escuchando en puerto ${PORT}`);
    console.log(`WebSocket habilitado para monitoreo en tiempo real`);
    console.log(`Optimizado para Raspberry Pi 5 con 16GB RAM`);
    
    // Iniciar simulación de datos para pruebas
    monitoreo.simularDatosSensores();
  });
}, 500);
