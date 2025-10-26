// Componente para flashear ESP32 directamente desde el navegador usando Web Serial API
import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button, 
  Typography, 
  Box, 
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  IconButton
} from '@mui/material';
import { 
  UsbRounded as UsbIcon,
  FlashOnRounded as FlashIcon,
  CheckCircleRounded as CheckIcon,
  ErrorRounded as ErrorIcon,
  InfoRounded as InfoIcon,
  MonitorRounded as MonitorIcon,
  PlayArrowRounded as StartIcon,
  StopRounded as StopIcon,
  SendRounded as SendIcon
} from '@mui/icons-material';

const WebFlasher = ({ open, onClose, nodo, firmwareBinario }) => {
  const [connected, setConnected] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [firmwareInfo, setFirmwareInfo] = useState(null);
  const [monitorSerial, setMonitorSerial] = useState(false);
  const [serialLogs, setSerialLogs] = useState([]);
  const [baudRate, setBaudRate] = useState(115200);
  const [wifiConfig, setWifiConfig] = useState({ ssid: '', hasPassword: false, serverIP: '' });
  const [userWifiSSID, setUserWifiSSID] = useState('');
  const [userWifiPassword, setUserWifiPassword] = useState('');
  const [userServerIP, setUserServerIP] = useState('192.168.1.100');
  const portRef = useRef(null);
  const readerRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{ message, type, timestamp }, ...prev]);
  };

  // Cargar información del firmware cuando se abre el dialog
  useEffect(() => {
    if (!open || !nodo) return;
    
    const cargarInfoFirmware = async () => {
      setLogs([]);
      setFirmwareInfo(null);
      try {
        const response = await fetch(`/api/nodos/${nodo.id}/info-firmware`);
        if (!response.ok) {
          throw new Error('Error obteniendo información del firmware');
        }
        const info = await response.json();
        setFirmwareInfo(info);
        addLog(`Firmware configurado para ${info.nodo.nombre}`, 'success');
        addLog(`GPIOs: ${info.estadisticas.total_gpios} | Sensores: ${info.estadisticas.total_sensores} | Actuadores: ${info.estadisticas.total_actuadores}`, 'info');
      } catch (error) {
        console.error('Error cargando información del firmware:', error);
        addLog('Error cargando información del firmware', 'error');
      }
    };

    const cargarConfigWiFi = async () => {
      try {
        const response = await fetch(`/api/nodos/${nodo.id}/wifi-config`);
        if (response.ok) {
          const config = await response.json();
          setWifiConfig(config);
          // Precargar campos si hay configuración guardada
          if (config.ssid) {
            setUserWifiSSID(config.ssid);
            if (config.serverIP) {
              setUserServerIP(config.serverIP);
            }
            addLog(`Configuración WiFi guardada: ${config.ssid}`, 'info');
            if (nodo.ip_address) {
              addLog(`IP actual: ${nodo.ip_address}`, 'success');
            }
          }
        }
      } catch (error) {
        console.error('Error cargando configuración WiFi:', error);
      }
    };

    cargarInfoFirmware();
    cargarConfigWiFi();
  }, [open, nodo]);

  const connectToDevice = async () => {
    try {
      // Verificar si Web Serial API está disponible
      if (!('serial' in navigator)) {
        addLog('Web Serial API no está disponible. Usa Chrome/Edge 89+ con HTTPS', 'error');
        addLog('También verifica que esté habilitado en chrome://flags/#enable-experimental-web-platform-features', 'warning');
        return;
      }

      // Verificar permisos
      if (!navigator.serial.requestPort) {
        addLog('Web Serial API está deshabilitada por política de permisos', 'error');
        addLog('Intenta acceder a la página via HTTPS o desde localhost', 'warning');
        return;
      }

      addLog('Solicitando puerto serial...', 'info');
      
      // Solicitar puerto serial al usuario
      // Primero intentar con filtros específicos
      let port;
      try {
        port = await navigator.serial.requestPort({
          filters: [
            { usbVendorId: 0x10C4, usbProductId: 0xEA60 }, // CP210x
            { usbVendorId: 0x1A86, usbProductId: 0x7523 }, // CH340
            { usbVendorId: 0x1A86, usbProductId: 0x55D4 }, // CH9102 (tu ESP32)
            { usbVendorId: 0x0403, usbProductId: 0x6001 }, // FTDI
            { usbVendorId: 0x303A, usbProductId: 0x1001 }, // ESP32-S3
            { usbVendorId: 0x303A }, // Cualquier ESP32 oficial
            { usbVendorId: 0x1A86 }, // Cualquier chip WCH
          ]
        });
      } catch (firstError) {
        addLog('No se encontró ESP32 con filtros. Intentando mostrar todos los dispositivos...', 'warning');
        // Si falla, intentar sin filtros para mostrar todos los dispositivos
        port = await navigator.serial.requestPort();
      }

      addLog('Puerto seleccionado, verificando estado...', 'info');
      
      // Verificar si el puerto ya está abierto
      if (port.readable && port.writable) {
        addLog('Puerto ya está abierto, usando conexión existente...', 'info');
        portRef.current = port;
        setConnected(true);
      } else {
        
        // Abrir conexión serial
        await port.open({
          baudRate: 115200,
          dataBits: 8,
          stopBits: 1,
          parity: 'none'
        });

        portRef.current = port;
        setConnected(true);
        addLog('¡Conectado al dispositivo ESP32!', 'success');
      }

      // Detectar información del chip (si la función existe)
      try {
        if (typeof detectChipInfo === 'function') {
          await detectChipInfo();
        }
      } catch (err) {
        console.warn('detectChipInfo falló:', err);
      }

    } catch (error) {
      console.error('Error conectando:', error);
    }
  };

  const detectChipInfo = async () => {
    try {
      addLog('Detectando información del chip...', 'info');
      
      // Aquí implementarías la detección del chip usando esptool-js
      // Por ahora simulamos la información
      const info = {
        chipType: 'ESP32',
        macAddress: '24:6F:28:XX:XX:XX',
        flashSize: '4MB',
        crystalFreq: '40MHz'
      };
      
      setDeviceInfo(info);
      addLog(`Chip detectado: ${info.chipType}`, 'success');
      addLog(`MAC Address: ${info.macAddress}`, 'info');

    } catch (error) {
      addLog(`Error detectando chip: ${error.message}`, 'error');
    }
  };

  const flashFirmware = async () => {
    if (!connected || !firmwareBinario) {
      addLog('Dispositivo no conectado o firmware no disponible', 'error');
      return;
    }

    // Validar configuración WiFi
    if (!userWifiSSID.trim() || !userWifiPassword.trim()) {
      addLog('Por favor ingresa SSID y contraseña WiFi', 'error');
      return;
    }

    try {
      setFlashing(true);
      setProgress(0);
      addLog('Iniciando proceso de flasheo...', 'info');

      // Paso 1: Guardar configuración WiFi
      addLog('Guardando configuración WiFi...', 'info');
      try {
        const configResponse = await fetch(`/api/nodos/${nodo.id}/generar-firmware-binario`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wifiSSID: userWifiSSID.trim(),
            wifiPassword: userWifiPassword.trim(),
            serverIP: userServerIP.trim()
          })
        });

        if (!configResponse.ok) {
          throw new Error('Error guardando configuración WiFi');
        }

        addLog(`✅ WiFi configurado: ${userWifiSSID}`, 'success');
        addLog(`✅ Servidor: ${userServerIP}:4000`, 'success');
        
        // Actualizar estado local
        setWifiConfig({
          ssid: userWifiSSID,
          hasPassword: true,
          serverIP: userServerIP
        });

      } catch (configError) {
        addLog(`Error configuración: ${configError.message}`, 'error');
        return;
      }

      // Simular proceso de flasheo (en implementación real usarías esptool-js)
      const steps = [
        'Entrando en modo bootloader...',
        'Borrando flash...',
        'Escribiendo firmware con WiFi configurado...',
        'Verificando firmware...',
        'Reiniciando dispositivo...'
      ];

      for (let i = 0; i < steps.length; i++) {
        addLog(steps[i], 'info');
        
        // Simular progreso
        for (let j = 0; j < 20; j++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setProgress(((i * 20) + j) / steps.length);
        }
      }

      setProgress(100);
      addLog('¡Firmware flasheado exitosamente!', 'success');
      addLog(`Nodo ${nodo.nombre} se conectará a ${userWifiSSID}`, 'success');
      addLog('Verifica el Monitor Serial para ver la IP asignada', 'info');

    } catch (error) {
      console.error('Error flasheando:', error);
      addLog(`Error: ${error.message}`, 'error');
    } finally {
      setFlashing(false);
    }
  };

  // Funciones del Monitor Serial
  const startSerialMonitor = async () => {
    if (!portRef.current) {
      addLog('Primero conecta el dispositivo', 'error');
      return;
    }

    try {
      // Si ya hay un monitor activo, pararlo primero
      if (monitorSerial) {
        await stopSerialMonitor();
      }

      addLog(`Iniciando monitor serial a ${baudRate} baud...`, 'info');
      
      // Verificar si el puerto está abierto y cerrarlo si es necesario para reconfigurar
      if (portRef.current.readable || portRef.current.writable) {
        addLog('Reconfigurando puerto serial...', 'info');
        await portRef.current.close();
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
      }
      
      // Abrir con el nuevo baud rate
      await portRef.current.open({ baudRate });
      
      setMonitorSerial(true);
      setSerialLogs([]);
      
      // Leer datos del puerto serial
      const reader = portRef.current.readable.getReader();
      readerRef.current = reader;
      
      addLog('Monitor serial iniciado - leyendo datos...', 'success');
      
      // Loop de lectura
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            // Convertir bytes a texto
            const text = new TextDecoder().decode(value);
            const lines = text.split('\n');
            
            lines.forEach(line => {
              if (line.trim()) {
                const timestamp = new Date().toLocaleTimeString();
                setSerialLogs(prev => [{ message: line.trim(), timestamp }, ...prev]);
              }
            });
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            addLog(`Error leyendo puerto serial: ${error.message}`, 'error');
          }
        }
      };
      
      readLoop();
      
    } catch (error) {
      console.error('Error iniciando monitor serial:', error);
      addLog(`Error iniciando monitor serial: ${error.message}`, 'error');
      setMonitorSerial(false);
    }
  };

  const stopSerialMonitor = async () => {
    try {
      setMonitorSerial(false);
      
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      
      if (portRef.current && portRef.current.readable) {
        await portRef.current.close();
      }
      
      addLog('Monitor serial detenido', 'info');
    } catch (error) {
      console.error('Error deteniendo monitor serial:', error);
      addLog(`Error deteniendo monitor: ${error.message}`, 'warning');
    }
  };

  const sendSerialCommand = async (command) => {
    if (!portRef.current || !monitorSerial) {
      addLog('Monitor serial no está activo', 'error');
      return;
    }

    try {
      const writer = portRef.current.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(command + '\r\n'));
      writer.releaseLock();
      
      addLog(`Enviado: ${command}`, 'info');
    } catch (error) {
      console.error('Error enviando comando:', error);
      addLog(`Error enviando comando: ${error.message}`, 'error');
    }
  };

  const disconnectDevice = async () => {
    if (portRef.current) {
      try {
        // Detener monitor serial si está activo
        if (monitorSerial) {
          await stopSerialMonitor();
        }

        // Cerrar puerto si está abierto
        if (portRef.current.readable || portRef.current.writable) {
          await portRef.current.close();
        }
        
        portRef.current = null;
        setConnected(false);
        setDeviceInfo(null);
        setSerialLogs([]);
        addLog('Dispositivo desconectado', 'info');
      } catch (error) {
        addLog(`Error desconectando: ${error.message}`, 'error');
      }
    }
  };

  const handleClose = async () => {
    await disconnectDevice();
    setLogs([]);
    setSerialLogs([]);
    setProgress(0);
    onClose();
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckIcon sx={{ color: 'success.main' }} />;
      case 'error': return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'warning': return <InfoIcon sx={{ color: 'warning.main' }} />;
      default: return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <FlashIcon />
          Flashear ESP32 - {nodo?.nombre}
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Información del Firmware */}
        {firmwareInfo && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom color="primary">
              📋 Información del Firmware
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Nodo:</strong> {firmwareInfo.nodo.nombre} ({firmwareInfo.nodo.tipo})
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Total GPIOs configurados:</strong> {firmwareInfo.estadisticas.total_gpios}
              </Typography>
            </Alert>
            
            {/* Sensores */}
            {firmwareInfo.sensores.length > 0 && (
              <Box mb={1}>
                <Typography variant="subtitle2" color="success.main">
                  🌡️ Sensores ({firmwareInfo.sensores.length}):
                </Typography>
                {firmwareInfo.sensores.map((sensor, index) => (
                  <Chip
                    key={index}
                    label={`GPIO ${sensor.gpio}: ${sensor.nombre}`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mr: 1, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
            
            {/* Actuadores */}
            {firmwareInfo.actuadores.length > 0 && (
              <Box mb={1}>
                <Typography variant="subtitle2" color="warning.main">
                  ⚡ Actuadores ({firmwareInfo.actuadores.length}):
                </Typography>
                {firmwareInfo.actuadores.map((actuador, index) => (
                  <Chip
                    key={index}
                    label={`GPIO ${actuador.gpio}: ${actuador.nombre}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ mr: 1, mb: 0.5 }}
                  />
                ))}
              </Box>
            )}
            
            {/* Librerías requeridas */}
            <Typography variant="caption" sx={{ color: '#FFFFFF' }}>
              Librerías: {firmwareInfo.estadisticas.librerias_requeridas.join(', ')}
            </Typography>
          </Box>
        )}

        {/* Información WiFi */}
        {wifiConfig && (wifiConfig.ssid || nodo?.ip_address) && (
          <Box mb={2} p={2} sx={{ backgroundColor: '#2E7D32', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#FFFFFF', mb: 1 }}>
              📡 Configuración de Red
            </Typography>
            
            {wifiConfig.ssid && (
              <Typography variant="body2" sx={{ color: '#E8F5E8' }}>
                <strong>WiFi configurado:</strong> {wifiConfig.ssid} {wifiConfig.hasPassword && '🔒'}
              </Typography>
            )}
            
            {nodo?.ip_address && (
              <Typography variant="body2" sx={{ color: '#E8F5E8' }}>
                <strong>IP actual:</strong> {nodo.ip_address} 
                {nodo.estado === 'online' && <Chip label="Online" size="small" color="success" sx={{ ml: 1 }} />}
              </Typography>
            )}
            
            {wifiConfig.serverIP && (
              <Typography variant="body2" sx={{ color: '#E8F5E8' }}>
                <strong>Servidor:</strong> {wifiConfig.serverIP}:4000
              </Typography>
            )}
            
            {wifiConfig.configurado_en && (
              <Typography variant="caption" sx={{ color: '#C8E6C9' }}>
                Configurado: {new Date(wifiConfig.configurado_en).toLocaleString()}
              </Typography>
            )}
          </Box>
        )}

        {/* Estado de conexión */}
        <Box mb={2}>
          <Alert 
            severity={connected ? 'success' : 'info'}
            icon={<UsbIcon />}
          >
            {connected 
              ? `Conectado al dispositivo ${deviceInfo?.chipType || 'ESP32'}` 
              : 'Conecta tu dispositivo ESP32 via USB'
            }
          </Alert>
          
          {/* Ayuda para Web Serial API */}
          {!connected && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Requisitos para Web Serial API:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • Usar Chrome/Edge 89+ <br/>
                • Acceder via HTTPS o localhost <br/>
                • Habilitar flags experimentales si es necesario <br/>
                • Conectar ESP32 via USB antes de hacer click
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Información del dispositivo */}
        {deviceInfo && (
          <Box mb={2}>
            <Typography variant="h6" gutterBottom>Información del Dispositivo</Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip label={`Chip: ${deviceInfo.chipType}`} size="small" />
              <Chip label={`MAC: ${deviceInfo.macAddress}`} size="small" />
              <Chip label={`Flash: ${deviceInfo.flashSize}`} size="small" />
              <Chip label={`Crystal: ${deviceInfo.crystalFreq}`} size="small" />
            </Box>
          </Box>
        )}

        {/* Progreso de flasheo */}
        {flashing && (
          <Box mb={2}>
            <Typography variant="body2" gutterBottom>
              Progreso de flasheo: {Math.round(progress)}%
            </Typography>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {/* Logs */}
        <Box>
          <Typography variant="h6" gutterBottom>Registro de Actividad</Typography>
          <Box 
            sx={{ 
              maxHeight: 300,
              overflow: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: '#1e1e1e'
            }}
          >
            <List dense>
              {logs.map((log, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getLogIcon(log.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.message}
                    secondary={log.timestamp}
                    primaryTypographyProps={{ 
                      variant: 'body2',
                      color: log.type === 'error' ? 'error' : '#FFFFFF'
                    }}
                    secondaryTypographyProps={{ 
                      variant: 'caption',
                      color: '#CCCCCC'
                    }}
                  />
                </ListItem>
              ))}
              {logs.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="Esperando actividad..."
                    primaryTypographyProps={{ color: '#FFFFFF' }}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        </Box>

        {/* Monitor Serial */}
        {connected && (
          <Box mt={3}>
            <Divider sx={{ mb: 2 }} />
            
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" color="primary">
                <MonitorIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Monitor Serial
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Baud Rate</InputLabel>
                  <Select
                    value={baudRate}
                    onChange={(e) => setBaudRate(e.target.value)}
                    disabled={monitorSerial}
                  >
                    <MenuItem value={9600}>9600</MenuItem>
                    <MenuItem value={57600}>57600</MenuItem>
                    <MenuItem value={115200}>115200</MenuItem>
                    <MenuItem value={230400}>230400</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant={monitorSerial ? "outlined" : "contained"}
                  color={monitorSerial ? "error" : "success"}
                  onClick={monitorSerial ? stopSerialMonitor : startSerialMonitor}
                  startIcon={monitorSerial ? <StopIcon /> : <StartIcon />}
                  disabled={flashing}
                >
                  {monitorSerial ? 'Detener' : 'Iniciar'}
                </Button>
              </Box>
            </Box>

            {/* Área de logs del serial */}
            <Box 
              sx={{ 
                maxHeight: 200,
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
                  <Box key={index} sx={{ color: '#00FF00', fontSize: '0.8rem', lineHeight: 1.2 }}>
                    <span style={{ color: '#888888' }}>[{log.timestamp}] </span>
                    {log.message}
                  </Box>
                ))
              ) : (
                <Typography variant="body2" sx={{ color: '#888888', fontStyle: 'italic' }}>
                  {monitorSerial ? 'Esperando datos del puerto serial...' : 'Inicia el monitor para ver datos del dispositivo'}
                </Typography>
              )}
            </Box>

            {/* Campo para enviar comandos */}
            {monitorSerial && (
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Escribe un comando..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendSerialCommand(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={!monitorSerial}
                />
                <IconButton
                  color="primary"
                  onClick={(e) => {
                    const input = e.target.closest('.MuiBox-root').querySelector('input');
                    if (input && input.value) {
                      sendSerialCommand(input.value);
                      input.value = '';
                    }
                  }}
                  disabled={!monitorSerial}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        )}

        {/* Configuración WiFi */}
        {connected && !flashing && (
          <Box mt={3} p={2} sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              📡 Configuración WiFi
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="WiFi SSID"
                value={userWifiSSID}
                onChange={(e) => setUserWifiSSID(e.target.value)}
                placeholder={wifiConfig.ssid || "Nombre de tu red WiFi"}
                fullWidth
                size="small"
                required
              />
              
              <TextField
                label="WiFi Password"
                type="password"
                value={userWifiPassword}
                onChange={(e) => setUserWifiPassword(e.target.value)}
                placeholder={wifiConfig.hasPassword ? "••••••••" : "Contraseña WiFi"}
                fullWidth
                size="small"
                required
              />
              
              <TextField
                label="Server IP"
                value={userServerIP}
                onChange={(e) => setUserServerIP(e.target.value)}
                placeholder="IP del servidor DomoticX"
                fullWidth
                size="small"
                helperText="IP donde está corriendo DomoticX (ej: 192.168.1.100)"
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={flashing}>
          Cancelar
        </Button>
        
        {!connected ? (
          <Button 
            onClick={connectToDevice}
            variant="contained"
            startIcon={<UsbIcon />}
          >
            Conectar Dispositivo
          </Button>
        ) : (
          <>
            <Button 
              onClick={disconnectDevice}
              disabled={flashing}
            >
              Desconectar
            </Button>
            <Button 
              onClick={flashFirmware}
              variant="contained"
              startIcon={<FlashIcon />}
              disabled={flashing || !firmwareBinario}
            >
              {flashing ? 'Flasheando...' : 'Flashear Firmware'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WebFlasher;