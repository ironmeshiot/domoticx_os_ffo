// API para generar firmware ESP32 desde configuración de nodo
const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/manager');
const ESP32FirmwareGenerator = require('../generators/esp32-firmware-generator');
const ESP32OTAFirmwareGenerator = require('../generators/esp32-ota-firmware-generator');
const path = require('path');
const fs = require('fs');

const db = getDatabase();

// POST /api/nodos/:nodoId/generar-firmware
// Genera el firmware .ino para el nodo especificado
router.post('/nodos/:nodoId/generar-firmware', async (req, res) => {
  try {
    const nodoId = req.params.nodoId;
    const { ota = false, serverIP } = req.body; // Opción para incluir OTA
    
    // 1. Obtener datos del nodo
    const nodo = await db.obtenerNodoPorId(nodoId);
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    
    // 2. Obtener asignaciones de sensores
    const sensoresAsignados = await db.obtenerAsignacionesSensoresPorNodo(nodoId);
    
    // 3. Obtener asignaciones de actuadores
    const actuadoresAsignados = await db.obtenerAsignacionesActuadoresPorNodo(nodoId);
    
    // 4. Obtener definiciones de sensores
    const definicionesSensores = await db.obtenerDefinicionesSensores();
    
    // 5. Obtener definiciones de actuadores
    const definicionesActuadores = await db.obtenerDefinicionesActuadores();
    
    // 6. Generar firmware (básico o con OTA)
    let generator;
    if (ota) {
      generator = new ESP32OTAFirmwareGenerator(
        nodo,
        sensoresAsignados,
        actuadoresAsignados,
        definicionesSensores,
        definicionesActuadores,
        serverIP || '192.168.1.100'
      );
    } else {
      generator = new ESP32FirmwareGenerator(
        nodo,
        sensoresAsignados,
        actuadoresAsignados,
        definicionesSensores,
        definicionesActuadores
      );
    }
    
    const firmware = generator.generarFirmware();
    
    // 7. Enviar como descarga
    const suffix = ota ? '_OTA' : '';
    const filename = `${nodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_firmware.ino`;
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(firmware);
    
  } catch (error) {
    console.error('Error generando firmware:', error);
    res.status(500).json({ error: 'Error generando firmware', mensaje: error.message });
  }
});

// GET /api/nodos/:nodoId/firmware-info
// Obtiene información sobre el firmware que se generaría
router.get('/nodos/:nodoId/firmware-info', async (req, res) => {
  try {
    const nodoId = req.params.nodoId;
    
    const nodo = await db.obtenerNodoPorId(nodoId);
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    
    const sensoresAsignados = await db.obtenerAsignacionesSensoresPorNodo(nodoId);
    const actuadoresAsignados = await db.obtenerAsignacionesActuadoresPorNodo(nodoId);
    
    // Contar sensores por tipo
    const sensoresPorTipo = {};
    sensoresAsignados.forEach(s => {
      const tipo = s.tipo || 'desconocido';
      sensoresPorTipo[tipo] = (sensoresPorTipo[tipo] || 0) + 1;
    });
    
    // Contar actuadores por tipo
    const actuadoresPorTipo = {};
    actuadoresAsignados.forEach(a => {
      const tipo = a.tipo || 'desconocido';
      actuadoresPorTipo[tipo] = (actuadoresPorTipo[tipo] || 0) + 1;
    });
    
    res.json({
      nodo: {
        id: nodo.id,
        nombre: nodo.nombre,
        tipo: nodo.tipo,
        ubicacion: nodo.ubicacion
      },
      estadisticas: {
        totalSensores: sensoresAsignados.length,
        totalActuadores: actuadoresAsignados.length,
        sensoresPorTipo,
        actuadoresPorTipo
      },
      requisitos: {
        librerias: this.calcularLibreriasNecesarias(sensoresAsignados, actuadoresAsignados),
        memoriaEstimada: this.estimarUsoMemoria(sensoresAsignados, actuadoresAsignados)
      },
      instrucciones: [
        '1. Descargar el archivo .ino',
        '2. Editar las credenciales WiFi (WIFI_SSID y WIFI_PASSWORD)',
        '3. Instalar las librerías requeridas en Arduino IDE',
        '4. Conectar el ESP32 y seleccionar el puerto correcto',
        '5. Compilar y subir el firmware'
      ]
    });
    
  } catch (error) {
    console.error('Error obteniendo info de firmware:', error);
    res.status(500).json({ error: 'Error obteniendo información', mensaje: error.message });
  }
});

// POST /api/nodos/:nodoId/generar-firmware-binario
// Genera el firmware binario .bin listo para flashear
router.post('/nodos/:nodoId/generar-firmware-binario', async (req, res) => {
  try {
    console.log('🔥 Endpoint generar-firmware-binario llamado para nodo:', req.params.nodoId);
    const nodoId = req.params.nodoId;
    const { serverIP, wifiSSID, wifiPassword } = req.body;
    
    // 1. Obtener datos del nodo
    const nodo = await db.obtenerNodoPorId(nodoId);
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    
    console.log('✓ Nodo encontrado:', nodo.nombre);
    
    // 2. Guardar configuración WiFi en la base de datos
    if (wifiSSID && wifiPassword) {
      console.log('💾 Guardando configuración WiFi:', wifiSSID);
      try {
        await db.actualizarConfiguracionWiFi(nodoId, {
          ssid: wifiSSID,
          password: wifiPassword,
          canal: null,
          modo_red: 'wifi'
        });
        console.log('✓ Configuración WiFi guardada');
      } catch (wifiError) {
        console.log('⚠️ Error guardando WiFi, continuando:', wifiError.message);
      }
    }
    
    // 3. Crear firmware binario simulado para testing
    const firmwareInfo = {
      nodo: nodo.nombre,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      wifi: {
        ssid: wifiSSID || 'TU_WIFI',
        configured: true
      }
    };
    
    console.log('🔧 Generando firmware binario simulado');
    // Crear un "binario" simulado para testing (en implementación real sería el .bin compilado)
    const simulatedBinary = Buffer.from([
      // Magic bytes para ESP32
      0xE9, 0x00, 0x00, 0x00,
      // Información del firmware (JSON comprimido)
      ...Buffer.from(JSON.stringify(firmwareInfo)),
      // Padding para simular un binario real
      ...Buffer.alloc(1024, 0xFF)
    ]);
    
    // 5. Enviar como descarga
    const filename = `${nodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_firmware.bin`;
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Firmware-Info', JSON.stringify(firmwareInfo));
    res.send(simulatedBinary);
    
  } catch (error) {
    console.error('Error generando firmware binario:', error);
    res.status(500).json({ error: 'Error generando firmware binario', mensaje: error.message });
  }
});

// GET /api/nodos/:nodoId/info-firmware
// Obtiene información del firmware que se generaría para el nodo (sin generarlo)
router.get('/nodos/:nodoId/info-firmware', async (req, res) => {
  try {
    const nodoId = req.params.nodoId;
    
    // 1. Obtener datos del nodo
    const nodo = await db.obtenerNodoPorId(nodoId);
    if (!nodo) {
      return res.status(404).json({ error: 'Nodo no encontrado' });
    }
    
    // 2. Obtener asignaciones de sensores
    const sensoresAsignados = await db.obtenerAsignacionesSensoresPorNodo(nodoId);
    
    // 3. Obtener asignaciones de actuadores
    const actuadoresAsignados = await db.obtenerAsignacionesActuadoresPorNodo(nodoId);
    
    // 4. Obtener definiciones de sensores
    const definicionesSensores = await db.obtenerDefinicionesSensores();
    
    // 5. Obtener definiciones de actuadores
    const definicionesActuadores = await db.obtenerDefinicionesActuadores();
    
    // 6. Preparar información del firmware
    const sensoresConDefinicion = sensoresAsignados.map(sensor => {
      const definicion = definicionesSensores.find(def => def.id === sensor.sensor_definicion_id);
      return {
        ...sensor,
        definicion
      };
    });
    
    const actuadoresConDefinicion = actuadoresAsignados.map(actuador => {
      const definicion = definicionesActuadores.find(def => def.id === actuador.actuador_definicion_id);
      return {
        ...actuador,
        definicion
      };
    });
    
    // 7. Información del firmware
    const firmwareInfo = {
      nodo: {
        id: nodo.id,
        nombre: nodo.nombre,
        descripcion: nodo.descripcion,
        tipo: nodo.tipo
      },
      sensores: sensoresConDefinicion.map(s => ({
        gpio: s.gpio,
        nombre: s.definicion?.nombre || 'Sensor desconocido',
        tipo: s.definicion?.tipo || 'unknown',
        descripcion: s.definicion?.descripcion || '',
        librerias: s.definicion?.librerias_requeridas ? s.definicion.librerias_requeridas.split(',') : []
      })),
      actuadores: actuadoresConDefinicion.map(a => ({
        gpio: a.gpio,
        nombre: a.definicion?.nombre || 'Actuador desconocido',
        tipo: a.definicion?.tipo || 'unknown',
        descripcion: a.definicion?.descripcion || '',
        librerias: a.definicion?.librerias_requeridas ? a.definicion.librerias_requeridas.split(',') : []
      })),
      configuracion: {
        wifi_ssid: '${WIFI_SSID}',
        servidor_ip: '${SERVER_IP}',
        puerto_servidor: 4000
      },
      estadisticas: {
        total_gpios: sensoresConDefinicion.length + actuadoresConDefinicion.length,
        total_sensores: sensoresConDefinicion.length,
        total_actuadores: actuadoresConDefinicion.length,
        librerias_requeridas: [
          ...new Set([
            'WiFi.h',
            'ArduinoJson.h',
            'WebSocketsClient.h',
            ...sensoresConDefinicion.flatMap(s => s.librerias || []),
            ...actuadoresConDefinicion.flatMap(a => a.librerias || [])
          ])
        ]
      }
    };
    
    res.json(firmwareInfo);
    
  } catch (error) {
    console.error('Error obteniendo información del firmware:', error);
    res.status(500).json({ error: 'Error obteniendo información del firmware', mensaje: error.message });
  }
});

// POST /api/nodos/:nodoId/registro
// Endpoint para que los ESP32 registren su IP y estado
router.post('/nodos/:nodoId/registro', async (req, res) => {
  try {
    const nodoId = req.params.nodoId;
    const { ipAddress, macAddress, firmwareVersion } = req.body;
    
    console.log(`📡 Nodo ${nodoId} registrando IP: ${ipAddress}`);
    
    // Actualizar IP y estado del nodo
    if (ipAddress) {
      await db.actualizarIPNodo(nodoId, ipAddress);
    }
    
    // Actualizar estado a online
    await db.actualizarEstadoNodo(nodoId, 'online');
    
    res.json({ 
      success: true, 
      message: 'Nodo registrado correctamente',
      ip: ipAddress,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error registrando nodo:', error);
    res.status(500).json({ error: 'Error registrando nodo', mensaje: error.message });
  }
});

// GET /api/nodos/:nodoId/wifi-config
// Obtiene la configuración WiFi guardada del nodo
router.get('/nodos/:nodoId/wifi-config', async (req, res) => {
  try {
    const nodoId = req.params.nodoId;
    const wifiConfig = await db.obtenerConfiguracionWiFiNodo(nodoId);
    
    if (wifiConfig) {
      // No enviar la contraseña completa por seguridad
      res.json({
        ssid: wifiConfig.ssid,
        hasPassword: !!wifiConfig.password,
        serverIP: wifiConfig.serverIP,
        configurado_en: wifiConfig.configurado_en
      });
    } else {
      res.json({ ssid: '', hasPassword: false, serverIP: '' });
    }
    
  } catch (error) {
    console.error('Error obteniendo configuración WiFi:', error);
    res.status(500).json({ error: 'Error obteniendo configuración WiFi' });
  }
});

module.exports = router;
