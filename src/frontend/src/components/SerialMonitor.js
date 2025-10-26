// Monitor Serial independiente para comunicación directa con ESP32
import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  Button, 
  Typography, 
  Box, 
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton,
  Chip
} from '@mui/material';
import { 
  UsbRounded as UsbIcon,
  MonitorRounded as MonitorIcon,
  PlayArrowRounded as StartIcon,
  StopRounded as StopIcon,
  SendRounded as SendIcon,
  CloseRounded as CloseIcon,
  SettingsRounded as SettingsIcon
} from '@mui/icons-material';

const SerialMonitor = ({ open, onClose }) => {
  const [connected, setConnected] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [serialLogs, setSerialLogs] = useState([]);
  const [baudRate, setBaudRate] = useState(115200);
  const [command, setCommand] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const lastDataRef = useRef(Date.now());

  // Conexión paso a paso con verificaciones
  const connectStepByStep = async () => {
    try {
      addSerialLog('🔬 Iniciando conexión paso a paso...', 'info');
      
      // Paso 1: Diagnóstico del sistema
      const diagSuccess = await diagnosticPort();
      if (!diagSuccess) {
        addSerialLog('❌ Diagnóstico fallido, abortando conexión', 'error');
        return;
      }

      // Paso 2: Solicitar puerto
      addSerialLog('👆 Selecciona el puerto ESP32...', 'info');
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x1a86 }, // CH340/CH341/CH9102
          { usbVendorId: 0x10c4 }, // CP2102/CP2104  
          { usbVendorId: 0x0403 }, // FT232
          { usbVendorId: 0x067b }  // PL2303
        ]
      });

      // Paso 3: Verificar información del dispositivo
      const info = port.getInfo();
      const chipType = getUSBChipType(info.usbVendorId, info.usbProductId);
      addSerialLog(`🔍 Dispositivo detectado: ${chipType}`, 'success');
      addSerialLog(`   VID: 0x${info.usbVendorId?.toString(16) || 'N/A'}`, 'info');
      addSerialLog(`   PID: 0x${info.usbProductId?.toString(16) || 'N/A'}`, 'info');

      // Paso 4: Limpiar conexión anterior
      if (portRef.current && portRef.current !== port) {
        try {
          await portRef.current.close();
          addSerialLog('🧹 Puerto anterior cerrado', 'info');
        } catch (e) {
          addSerialLog(`⚠️ Puerto anterior: ${e.message}`, 'warning');
        }
      }

      portRef.current = port;

      // Paso 5: Verificar estado del puerto
      addSerialLog('🔍 Verificando estado del puerto...', 'info');
      
      if (port.readable && port.readable.locked) {
        addSerialLog('⚠️ Puerto con reader bloqueado', 'warning');
        try {
          const reader = port.readable.getReader();
          reader.releaseLock();
          addSerialLog('✅ Reader liberado', 'success');
        } catch (e) {
          addSerialLog(`❌ Error liberando reader: ${e.message}`, 'error');
        }
      }

      // Paso 6: Abrir conexión
      addSerialLog('🔗 Abriendo puerto serial...', 'info');
      
      await port.open({ 
        baudRate: baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      // Paso 7: Verificar streams
      if (!port.readable) {
        throw new Error('Stream de lectura no disponible');
      }
      if (!port.writable) {
        throw new Error('Stream de escritura no disponible');
      }

      addSerialLog('✅ Streams verificados correctamente', 'success');

      // Paso 8: Finalizar conexión
      setConnected(true);
      addSerialLog('🎉 Conexión establecida exitosamente', 'success');
      addSerialLog(`📡 Velocidad: ${baudRate} baud`, 'info');

    } catch (error) {
      // Manejar cancelación de selección de puerto
      if (error.name === 'NotFoundError' && error.message.includes('No port selected')) {
        addSerialLog('ℹ️ Selección de puerto cancelada', 'info');
        return;
      }
      
      addSerialLog(`❌ Error en conexión paso a paso: ${error.message}`, 'error');
      
      // Sugerencias específicas según el error
      if (error.message.includes('Failed to open')) {
        addSerialLog('💡 Posibles soluciones:', 'warning');
        addSerialLog('• Cierra Arduino IDE, PlatformIO u otros programas', 'warning');
        addSerialLog('• Desconecta y reconecta el cable USB', 'warning');
        addSerialLog('• Prueba otro puerto USB', 'warning');
        addSerialLog('• Reinicia el ESP32 (botón RST)', 'warning');
        addSerialLog('• Verifica que los drivers estén instalados', 'warning');
      }
      
      setConnected(false);
      portRef.current = null;
    }
  };

  // Conectar al dispositivo ESP32
  const connectToDevice = async () => {
    try {
      if (!('serial' in navigator)) {
        addSerialLog('❌ Web Serial API no disponible', 'error');
        addSerialLog('ℹ️ Usa Chrome/Edge 89+ con HTTPS', 'info');
        return;
      }

      addSerialLog('🔍 Solicitando puerto serial...', 'info');

      // Solicitar puerto serial con manejo de errores mejorado
      let port;
      try {
        port = await navigator.serial.requestPort({
          filters: [
            { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // CP210x
            { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // CH340
            { usbVendorId: 0x1A86, usbProductId: 0x55D4 }, // CH9102
            { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
            { usbVendorId: 0x303A }, // ESP32 oficial
            { usbVendorId: 0x1A86 }, // Cualquier chip WCH
          ]
        });
      } catch (firstError) {
        addSerialLog('⚠️ Sin filtros específicos, mostrando todos...', 'warning');
        try {
          port = await navigator.serial.requestPort();
        } catch (secondError) {
          if (secondError.name === 'NotFoundError') {
            addSerialLog('❌ No se seleccionó ningún puerto', 'error');
          } else {
            addSerialLog(`❌ Error solicitando puerto: ${secondError.message}`, 'error');
          }
          return;
        }
      }

      addSerialLog('📱 Puerto seleccionado, verificando estado...', 'info');

      // Verificar si el puerto ya está abierto
      if (port.readable && port.writable) {
        addSerialLog('ℹ️ Puerto ya abierto, usando conexión existente', 'info');
        portRef.current = port;
        setConnected(true);
        addSerialLog('✅ Conectado exitosamente', 'info');
        return;
      }

      // Si el puerto está parcialmente abierto, cerrarlo primero
      if (port.readable || port.writable) {
        addSerialLog('🔄 Cerrando conexión previa...', 'warning');
        try {
          await port.close();
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (closeError) {
          addSerialLog(`⚠️ Advertencia cerrando: ${closeError.message}`, 'warning');
        }
      }

      addSerialLog('🔗 Abriendo nueva conexión...', 'info');

      // Abrir conexión con reintentos
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          await port.open({
            baudRate: baudRate,
            dataBits: 8,
            stopBits: 1,
            parity: 'none'
          });
          
          portRef.current = port;
          setConnected(true);
          addSerialLog('✅ Dispositivo conectado exitosamente', 'info');
          addSerialLog(`📡 Puerto abierto a ${baudRate} baud`, 'info');
          return;
          
        } catch (openError) {
          attempts++;
          addSerialLog(`❌ Intento ${attempts}/${maxAttempts} fallido: ${openError.message}`, 'error');
          
          if (attempts < maxAttempts) {
            addSerialLog('🔄 Reintentando en 1 segundo...', 'warning');
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            addSerialLog('💡 Sugerencias:', 'info');
            addSerialLog('  • Desconecta y reconecta el ESP32', 'info');
            addSerialLog('  • Cierra otras aplicaciones que usen el puerto', 'info');
            addSerialLog('  • Verifica que el cable USB funcione correctamente', 'info');
            addSerialLog('  • Usa el botón "Modo Seguro" para más detalles', 'warning');
          }
        }
      }

    } catch (error) {
      console.error('Error conectando:', error);
      addSerialLog(`❌ Error inesperado: ${error.message}`, 'error');
    }
  };

  // Iniciar monitor serial
  const startMonitoring = async () => {
    if (!portRef.current) {
      alert('Primero conecta un dispositivo');
      return;
    }

    try {
      setMonitoring(true);
      addSerialLog('🔍 Monitor serial iniciado...', 'success');
      addSerialLog('📡 Escuchando datos del dispositivo...', 'info');
      
      const reader = portRef.current.readable.getReader();
      readerRef.current = reader;
      
      // Loop de lectura
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');
            
            lines.forEach(line => {
              if (line.trim()) {
                addSerialLog(line.trim(), 'data');
                lastDataRef.current = Date.now();
              }
            });
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error leyendo puerto serial:', error);
            addSerialLog(`❌ Error: ${error.message}`, 'error');
          }
        }
      };
      
      readLoop();
      
    } catch (error) {
      console.error('Error iniciando monitor:', error);
      addSerialLog(`❌ Error iniciando monitor: ${error.message}`, 'error');
      setMonitoring(false);
    }
  };

  // Detener monitor serial
  const stopMonitoring = async () => {
    try {
      setMonitoring(false);
      
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      
      addSerialLog('⏹️ Monitor detenido');
    } catch (error) {
      console.error('Error deteniendo monitor:', error);
      addSerialLog(`⚠️ Error deteniendo: ${error.message}`, 'warning');
    }
  };

  // Enviar comando
  const sendCommand = async () => {
    if (!portRef.current || !monitoring || !command.trim()) {
      return;
    }

    try {
      const writer = portRef.current.writable.getWriter();
      const encoder = new TextEncoder();
      
      // Probar diferentes terminaciones según el comando
      if (command.toLowerCase() === 'help' || command.toLowerCase() === 'test') {
        // Para comandos especiales, probar múltiples formatos
        addSerialLog('🔍 Probando diferentes formatos de comando...', 'info');
        
        await writer.write(encoder.encode(command + '\n'));
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await writer.write(encoder.encode(command + '\r\n'));
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await writer.write(encoder.encode(command + '\r'));
      } else {
        await writer.write(encoder.encode(command + '\r\n'));
      }
      
      writer.releaseLock();
      
      addSerialLog(`📤 Enviado: ${command}`, 'sent');
      setCommand('');
      
      // Verificar respuesta después de 3 segundos
      setTimeout(() => {
        const timeSinceLastData = Date.now() - lastDataRef.current;
        if (timeSinceLastData > 3000) {
          addSerialLog('⏱️ Sin respuesta del dispositivo', 'warning');
          addSerialLog('💡 Posibles causas:', 'info');
          addSerialLog('  • El firmware no soporta comandos seriales', 'info');
          addSerialLog('  • Comando no reconocido', 'info');
          addSerialLog('  • Prueba presionar RST en el ESP32', 'info');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error enviando comando:', error);
      addSerialLog(`❌ Error enviando: ${error.message}`, 'error');
    }
  };

  // Desconectar dispositivo
  const disconnect = async () => {
    try {
      addSerialLog('🔄 Desconectando dispositivo...', 'info');
      
      // Detener monitor si está activo
      if (monitoring) {
        await stopMonitoring();
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
      }

      // Cerrar puerto si está abierto
      if (portRef.current) {
        try {
          if (portRef.current.readable || portRef.current.writable) {
            await portRef.current.close();
          }
        } catch (closeError) {
          addSerialLog(`⚠️ Advertencia al cerrar puerto: ${closeError.message}`, 'warning');
        }
        
        portRef.current = null;
      }

      setConnected(false);
      addSerialLog('✅ Dispositivo desconectado correctamente', 'info');
    } catch (error) {
      console.error('Error desconectando:', error);
      addSerialLog(`❌ Error desconectando: ${error.message}`, 'error');
      
      // Forzar reset de estados incluso si hay error
      portRef.current = null;
      setConnected(false);
      setMonitoring(false);
    }
  };

  // Agregar log al monitor serial
  const addSerialLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setSerialLogs(prev => [{ message, timestamp, type }, ...prev]);
  };

  // Limpiar logs
  const clearLogs = () => {
    setSerialLogs([]);
  };

  // Función de diagnóstico avanzado
  const diagnosticPort = async () => {
    try {
      addSerialLog('🔬 Iniciando diagnóstico del sistema...', 'info');
      
      // 1. Verificar soporte del navegador
      if (!('serial' in navigator)) {
        addSerialLog('❌ Web Serial API no soportada', 'error');
        addSerialLog('💡 Usa Chrome/Edge 89+ con HTTPS', 'warning');
        return false;
      }
      addSerialLog('✅ Web Serial API disponible', 'success');

      // 2. Verificar permisos
      try {
        const ports = await navigator.serial.getPorts();
        addSerialLog(`📋 Puertos con permisos: ${ports.length}`, 'info');
        
        ports.forEach((port, index) => {
          const info = port.getInfo();
          addSerialLog(`  Puerto ${index + 1}: VID=${info.usbVendorId || 'N/A'}, PID=${info.usbProductId || 'N/A'}`, 'info');
        });
      } catch (error) {
        addSerialLog(`⚠️ Error verificando permisos: ${error.message}`, 'warning');
      }

      // 3. Verificar estado del sistema
      const userAgent = navigator.userAgent;
      addSerialLog(`🌐 Navegador: ${userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Edge') ? 'Edge' : 'Otro'}`, 'info');
      addSerialLog(`🔐 Protocolo: ${window.location.protocol}`, 'info');
      
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        addSerialLog('⚠️ HTTPS requerido para Web Serial API', 'warning');
      }

      // 4. Verificar estado del puerto actual
      if (portRef.current) {
        addSerialLog('🔍 Analizando puerto actual...', 'info');
        const info = portRef.current.getInfo();
        addSerialLog(`  VendorID: 0x${info.usbVendorId?.toString(16) || 'N/A'}`, 'info');
        addSerialLog(`  ProductID: 0x${info.usbProductId?.toString(16) || 'N/A'}`, 'info');
        
        // Identificar chip USB
        const chipType = getUSBChipType(info.usbVendorId, info.usbProductId);
        addSerialLog(`  Chip USB: ${chipType}`, chipType === 'Desconocido' ? 'warning' : 'success');
      }

      addSerialLog('🎯 Diagnóstico completado', 'success');
      return true;

    } catch (error) {
      addSerialLog(`❌ Error en diagnóstico: ${error.message}`, 'error');
      return false;
    }
  };

  // Identificar tipo de chip USB
  const getUSBChipType = (vendorId, productId) => {
    const chips = {
      0x1a86: { 0x7523: 'CH340/CH341', 0x55d4: 'CH9102' },
      0x10c4: { 0xea60: 'CP2102/CP2104' },
      0x0403: { 0x6001: 'FT232', 0x6014: 'FT232H' },
      0x067b: { 0x2303: 'PL2303' }
    };
    
    return chips[vendorId]?.[productId] || 'Desconocido';
  };

  // Autodetección de baud rate
  const autoDetectBaudRate = async () => {
    if (!portRef.current || !connected) return;

    setAutoDetecting(true);
    addSerialLog('🔍 Detectando velocidad óptima...', 'info');

    const commonRates = [115200, 9600, 57600, 38400, 19200, 74880];
    let bestRate = baudRate;
    let maxDataReceived = 0;

    for (const rate of commonRates) {
      try {
        addSerialLog(`🧪 Probando ${rate} baud...`, 'info');
        
        // Configurar puerto temporal con nueva velocidad
        await portRef.current.close();
        await portRef.current.open({ baudRate: rate });
        
        // Escuchar durante 2 segundos
        const reader = portRef.current.readable.getReader();
        let dataCount = 0;
        const startTime = Date.now();
        
        while (Date.now() - startTime < 2000) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value && value.length > 0) {
            dataCount += value.length;
          }
        }
        
        reader.releaseLock();
        
        if (dataCount > maxDataReceived) {
          maxDataReceived = dataCount;
          bestRate = rate;
        }
        
        addSerialLog(`📊 ${rate} baud: ${dataCount} bytes recibidos`, 'info');
        
      } catch (error) {
        addSerialLog(`❌ Error probando ${rate}: ${error.message}`, 'error');
      }
    }

    if (bestRate !== baudRate) {
      setBaudRate(bestRate);
      addSerialLog(`✅ Velocidad óptima detectada: ${bestRate} baud`, 'success');
      
      // Reconectar con la nueva velocidad
      await portRef.current.close();
      await portRef.current.open({ baudRate: bestRate });
    } else {
      addSerialLog(`ℹ️ Manteniendo velocidad actual: ${baudRate} baud`, 'info');
    }

    setAutoDetecting(false);
  };

  // Manejar cierre
  const handleClose = async () => {
    await disconnect();
    setSerialLogs([]);
    onClose();
  };

  // Obtener color del log según tipo
  const getLogColor = (type) => {
    switch (type) {
      case 'data': return '#00FF00';     // Verde para datos del dispositivo
      case 'sent': return '#00BFFF';     // Azul para comandos enviados
      case 'error': return '#FF4444';    // Rojo para errores
      case 'warning': return '#FFA500';  // Naranja para warnings
      default: return '#FFFFFF';         // Blanco para info
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'background.paper', minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center">
          <MonitorIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Monitor Serial</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Estado de conexión */}
        <Box mb={2}>
          <Alert 
            severity={connected ? 'success' : 'info'}
            icon={<UsbIcon />}
            sx={{ mb: 2 }}
          >
            {connected 
              ? `✅ Conectado - Monitor ${monitoring ? 'activo' : 'inactivo'}` 
              : '🔌 Conecta tu dispositivo ESP32 via USB'
            }
          </Alert>
        </Box>

        {/* Configuración */}
        <Box mb={2}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            Configuración
          </Typography>
          
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Baud Rate</InputLabel>
              <Select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                disabled={connected}
              >
                <MenuItem value={9600}>9600</MenuItem>
                <MenuItem value={57600}>57600</MenuItem>
                <MenuItem value={115200}>115200</MenuItem>
                <MenuItem value={230400}>230400</MenuItem>
              </Select>
            </FormControl>

            {connected && (
              <Button
                variant="outlined"
                size="small"
                onClick={autoDetectBaudRate}
                disabled={autoDetecting}
                startIcon={<SettingsIcon />}
              >
                {autoDetecting ? 'Detectando...' : 'Auto-detectar'}
              </Button>
            )}

            {!connected ? (
              <>
                <Button
                  variant="contained"
                  onClick={connectToDevice}
                  startIcon={<UsbIcon />}
                >
                  Conectar
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={connectStepByStep}
                  startIcon={<SettingsIcon />}
                >
                  Modo Seguro
                </Button>
                
                <Button
                  variant="text"
                  size="small"
                  onClick={diagnosticPort}
                  startIcon={<MonitorIcon />}
                >
                  Diagnóstico
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant={monitoring ? "outlined" : "contained"}
                  color={monitoring ? "error" : "success"}
                  onClick={monitoring ? stopMonitoring : startMonitoring}
                  startIcon={monitoring ? <StopIcon /> : <StartIcon />}
                >
                  {monitoring ? 'Detener' : 'Iniciar'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={disconnect}
                >
                  Desconectar
                </Button>
              </>
            )}

            <Button
              variant="outlined"
              onClick={clearLogs}
              disabled={serialLogs.length === 0}
            >
              Limpiar
            </Button>

            {connected && (
              <>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    // Forzar reset de estados
                    setMonitoring(false);
                    setConnected(false);
                    portRef.current = null;
                    readerRef.current = null;
                    addSerialLog('🔄 Reset forzado aplicado', 'warning');
                  }}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  Reset
                </Button>
                
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => {
                    addSerialLog('🔍 Verificando actividad del dispositivo...', 'info');
                    addSerialLog('💡 Si no aparecen datos automáticamente:', 'info');
                    addSerialLog('  • Presiona el botón RST físico del ESP32', 'info');
                    addSerialLog('  • El firmware puede no usar Serial.print()', 'info');
                    addSerialLog('  • Verifica que el código esté programado correctamente', 'info');
                    addSerialLog('  • Algunos firmwares solo responden a comandos específicos', 'info');
                  }}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  ¿Sin datos?
                </Button>
              </>
            )}
          </Box>

          {connected && (
            <Box>
              <Chip 
                label={`Puerto: ${portRef.current?.getInfo?.()?.usbProductId || 'ESP32'}`}
                size="small" 
                color="success" 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`${baudRate} baud`}
                size="small" 
                color="info" 
              />
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Monitor de datos */}
        <Box>
          <Typography variant="h6" gutterBottom>
            📺 Monitor de Datos
          </Typography>
          
          <Box 
            sx={{ 
              height: 300,
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: '#000000',
              p: 1,
              mb: 2,
              fontFamily: 'monospace'
            }}
          >
            {serialLogs.length > 0 ? (
              serialLogs.map((log, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    color: getLogColor(log.type), 
                    fontSize: '0.85rem', 
                    lineHeight: 1.3,
                    mb: 0.2
                  }}
                >
                  <span style={{ color: '#666666' }}>[{log.timestamp}] </span>
                  {log.message}
                </Box>
              ))
            ) : (
              <Typography 
                variant="body2" 
                sx={{ color: '#666666', fontStyle: 'italic', textAlign: 'center', mt: 10 }}
              >
                {connected 
                  ? (monitoring ? 'Esperando datos del dispositivo...' : 'Inicia el monitor para ver datos')
                  : 'Conecta un dispositivo para empezar'
                }
              </Typography>
            )}
          </Box>

          {/* Envío de comandos */}
          {connected && monitoring && (
            <Box display="flex" gap={1}>
              <TextField
                size="small"
                fullWidth
                placeholder="Escribe un comando y presiona Enter..."
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendCommand();
                  }
                }}
              />
              <IconButton
                color="primary"
                onClick={sendCommand}
                disabled={!command.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SerialMonitor;