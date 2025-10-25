import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, TextField, Typography, Chip, Paper, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Alert, Divider, IconButton
} from '@mui/material';
import { Close as CloseIcon, Sensors as SensorsIcon, Power as PowerIcon } from '@mui/icons-material';
import { 
  getSensorAssignmentsByNode, 
  getActuatorAssignmentsByNode,
  getSensorDefinitions,
  getActuatorDefinitions,
  createSensorAssignment,
  createActuatorAssignment,
  updateSensorAssignment,
  updateActuatorAssignment,
  deleteSensorAssignment,
  deleteActuatorAssignment
} from '../services/nodeService';
import '../styles/gpio-manager.css';

// Información detallada de cada pin del ESP32
const ESP32_PIN_INFO = {
  0: { name: 'GPIO0', alt: ['Boot', 'ADC2_CH1', 'Touch1'], note: 'Strapping pin' },
  1: { name: 'TX0', alt: ['UART0 TX', 'CLK_OUT3'], note: 'Serial output' },
  2: { name: 'GPIO2', alt: ['ADC2_CH2', 'Touch2'], note: 'Strapping pin, LED' },
  3: { name: 'RX0', alt: ['UART0 RX', 'CLK_OUT2'], note: 'Serial input' },
  4: { name: 'GPIO4', alt: ['ADC2_CH0', 'Touch0'], note: 'OK' },
  5: { name: 'GPIO5', alt: ['VSPI_SS'], note: 'Strapping pin' },
  6: { name: 'SCK', alt: ['Flash CLK'], note: 'Flash - No usar' },
  7: { name: 'SDO', alt: ['Flash D0'], note: 'Flash - No usar' },
  8: { name: 'SDI', alt: ['Flash D1'], note: 'Flash - No usar' },
  9: { name: 'SHD', alt: ['Flash D2'], note: 'Flash - No usar' },
  10: { name: 'SWP', alt: ['Flash D3'], note: 'Flash - No usar' },
  11: { name: 'CSC', alt: ['Flash CMD'], note: 'Flash - No usar' },
  12: { name: 'GPIO12', alt: ['ADC2_CH5', 'Touch5', 'HSPI_MISO'], note: 'Strapping pin' },
  13: { name: 'GPIO13', alt: ['ADC2_CH4', 'Touch4', 'HSPI_MOSI'], note: 'OK' },
  14: { name: 'GPIO14', alt: ['ADC2_CH6', 'Touch6', 'HSPI_CLK'], note: 'OK' },
  15: { name: 'GPIO15', alt: ['ADC2_CH3', 'Touch3', 'HSPI_SS'], note: 'Strapping pin' },
  16: { name: 'GPIO16', alt: ['UART2 RX'], note: 'OK - PSRAM' },
  17: { name: 'GPIO17', alt: ['UART2 TX'], note: 'OK - PSRAM' },
  18: { name: 'GPIO18', alt: ['VSPI_SCK'], note: 'OK' },
  19: { name: 'GPIO19', alt: ['VSPI_MISO'], note: 'OK' },
  21: { name: 'GPIO21', alt: ['I2C_SDA'], note: 'OK' },
  22: { name: 'GPIO22', alt: ['I2C_SCL'], note: 'OK' },
  23: { name: 'GPIO23', alt: ['VSPI_MOSI'], note: 'OK' },
  25: { name: 'GPIO25', alt: ['ADC2_CH8', 'DAC1'], note: 'OK' },
  26: { name: 'GPIO26', alt: ['ADC2_CH9', 'DAC2'], note: 'OK' },
  27: { name: 'GPIO27', alt: ['ADC2_CH7', 'Touch7'], note: 'OK' },
  32: { name: 'GPIO32', alt: ['ADC1_CH4', 'Touch9'], note: 'OK' },
  33: { name: 'GPIO33', alt: ['ADC1_CH5', 'Touch8'], note: 'OK' },
  34: { name: 'GPIO34', alt: ['ADC1_CH6'], note: 'Input only' },
  35: { name: 'GPIO35', alt: ['ADC1_CH7'], note: 'Input only' },
  36: { name: 'VP', alt: ['ADC1_CH0', 'GPIO36'], note: 'Input only' },
  39: { name: 'VN', alt: ['ADC1_CH3', 'GPIO39'], note: 'Input only' }
};

// GPIOs del ESP32 con sus características
const ESP32_GPIOS = {
  // GPIOs de entrada/salida estándar
  usable: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
  // GPIOs solo de entrada (sin pullup/pulldown interno)
  inputOnly: [34, 35, 36, 39],
  // GPIOs con restricciones o uso especial
  restricted: [1, 3, 6, 7, 8, 9, 10, 11],
  // GPIOs de strapping (pueden causar problemas al boot)
  strapping: [0, 2, 5, 12, 15]
};

function GPIOManager({ gpioSensores, gpioActuadores, gpioLibres, onChange, tipoNodo, nodoId }) {
  const [gpiosUsados, setGpiosUsados] = useState({});
  const [conflictos, setConflictos] = useState([]);
  const [mostrarImagen, setMostrarImagen] = useState(true);
  const [asignaciones, setAsignaciones] = useState({ sensores: [], actuadores: [] });
  const [cargando, setCargando] = useState(false);

  // Estado para el modal de asignación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gpioSeleccionado, setGpioSeleccionado] = useState(null);
  const [tipoDispositivo, setTipoDispositivo] = useState(''); // 'sensor' o 'actuador'
  const [definicionSeleccionada, setDefinicionSeleccionada] = useState('');
  const [aliasDispositivo, setAliasDispositivo] = useState('');
  const [ubicacionDispositivo, setUbicacionDispositivo] = useState('');
  const [definicionesDisponibles, setDefinicionesDisponibles] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar asignaciones de sensores y actuadores
  useEffect(() => {
    if (!nodoId) return;
    
    const cargarAsignaciones = async () => {
      setCargando(true);
      try {
        const [sensores, actuadores] = await Promise.all([
          getSensorAssignmentsByNode(nodoId),
          getActuatorAssignmentsByNode(nodoId)
        ]);
        setAsignaciones({ sensores, actuadores });
      } catch (error) {
        console.error('Error cargando asignaciones:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarAsignaciones();
  }, [nodoId]);

  // Función para abrir modal al hacer clic en un GPIO
  const handleGPIOClick = async (gpio) => {
    if (!nodoId) {
      alert('No se puede asignar dispositivos sin un ID de nodo');
      return;
    }

    const asignacion = obtenerAsignacionGPIO(gpio);
    const pinInfo = ESP32_PIN_INFO[gpio];

    // Verificar si el pin es restringido
    if (ESP32_GPIOS.restricted.includes(gpio)) {
      alert(`⚠️ GPIO ${gpio} (${pinInfo?.name}) está reservado para el sistema: ${pinInfo?.note}`);
      return;
    }

    setGpioSeleccionado(gpio);
    setError(null);

    if (asignacion) {
      // Ya tiene asignación - mostrar para editar/eliminar
      setTipoDispositivo(asignacion.tipo);
      setDefinicionSeleccionada(asignacion.definicionId);
      setAliasDispositivo(asignacion.alias || '');
      setUbicacionDispositivo(asignacion.ubicacionEspecifica || '');
    } else {
      // Nuevo - resetear campos
      setTipoDispositivo('');
      setDefinicionSeleccionada('');
      setAliasDispositivo('');
      setUbicacionDispositivo('');
    }

    setModalAbierto(true);
  };

  // Cargar definiciones cuando se selecciona el tipo
  useEffect(() => {
    if (!tipoDispositivo || !modalAbierto) return;

    const cargarDefiniciones = async () => {
      try {
        const definiciones = tipoDispositivo === 'sensor' 
          ? await getSensorDefinitions()
          : await getActuatorDefinitions();
        setDefinicionesDisponibles(definiciones);
      } catch (error) {
        console.error('Error cargando definiciones:', error);
        setError('Error al cargar las definiciones disponibles');
      }
    };

    cargarDefiniciones();
  }, [tipoDispositivo, modalAbierto]);

  // Guardar asignación
  const guardarAsignacion = async () => {
    if (!tipoDispositivo || !definicionSeleccionada) {
      setError('Debe seleccionar el tipo y la definición del dispositivo');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const asignacionActual = obtenerAsignacionGPIO(gpioSeleccionado);
      const payload = {
        nodoId: nodoId,
        definicionId: definicionSeleccionada,
        pin: gpioSeleccionado,
        alias: aliasDispositivo || null,
        ubicacionEspecifica: ubicacionDispositivo || null,
        activo: true
      };

      if (asignacionActual) {
        // Actualizar existente
        if (tipoDispositivo === 'sensor') {
          await updateSensorAssignment(asignacionActual.id, payload);
        } else {
          await updateActuatorAssignment(asignacionActual.id, payload);
        }
      } else {
        // Crear nueva
        if (tipoDispositivo === 'sensor') {
          await createSensorAssignment(payload);
        } else {
          await createActuatorAssignment(payload);
        }
      }

      // Recargar asignaciones
      const [sensores, actuadores] = await Promise.all([
        getSensorAssignmentsByNode(nodoId),
        getActuatorAssignmentsByNode(nodoId)
      ]);
      setAsignaciones({ sensores, actuadores });

      // Cerrar modal
      cerrarModal();
    } catch (error) {
      console.error('Error guardando asignación:', error);
      setError(error.message || 'Error al guardar la asignación');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar asignación
  const eliminarAsignacion = async () => {
    const asignacion = obtenerAsignacionGPIO(gpioSeleccionado);
    if (!asignacion) return;

    if (!window.confirm(`¿Eliminar la asignación de ${asignacion.definicionNombre} del GPIO ${gpioSeleccionado}?`)) {
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      if (asignacion.tipo === 'sensor') {
        await deleteSensorAssignment(asignacion.id);
      } else {
        await deleteActuatorAssignment(asignacion.id);
      }

      // Recargar asignaciones
      const [sensores, actuadores] = await Promise.all([
        getSensorAssignmentsByNode(nodoId),
        getActuatorAssignmentsByNode(nodoId)
      ]);
      setAsignaciones({ sensores, actuadores });

      cerrarModal();
    } catch (error) {
      console.error('Error eliminando asignación:', error);
      setError(error.message || 'Error al eliminar la asignación');
    } finally {
      setGuardando(false);
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setGpioSeleccionado(null);
    setTipoDispositivo('');
    setDefinicionSeleccionada('');
    setAliasDispositivo('');
    setUbicacionDispositivo('');
    setDefinicionesDisponibles([]);
    setError(null);
  };

  // Parsear GPIOs en uso
  useEffect(() => {
    const sensores = parseGPIOs(gpioSensores);
    const actuadores = parseGPIOs(gpioActuadores);
    const libres = parseGPIOs(gpioLibres);

    const usados = {};
    const conf = [];

    sensores.forEach(gpio => {
      if (usados[gpio]) {
        conf.push(gpio);
        usados[gpio].push('sensor');
      } else {
        usados[gpio] = ['sensor'];
      }
    });

    actuadores.forEach(gpio => {
      if (usados[gpio]) {
        conf.push(gpio);
        usados[gpio].push('actuador');
      } else {
        usados[gpio] = ['actuador'];
      }
    });

    libres.forEach(gpio => {
      if (usados[gpio]) {
        conf.push(gpio);
        usados[gpio].push('libre');
      } else {
        usados[gpio] = ['libre'];
      }
    });

    setGpiosUsados(usados);
    setConflictos([...new Set(conf)]);
  }, [gpioSensores, gpioActuadores, gpioLibres]);

  const parseGPIOs = (str) => {
    if (!str) return [];
    return str.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  };

  // Obtener asignación para un GPIO específico
  const obtenerAsignacionGPIO = (gpio) => {
    const sensor = asignaciones.sensores.find(s => s.pin === gpio || s.pin === String(gpio));
    if (sensor) return { tipo: 'sensor', ...sensor };
    
    const actuador = asignaciones.actuadores.find(a => a.pin === gpio || a.pin === String(gpio));
    if (actuador) return { tipo: 'actuador', ...actuador };
    
    return null;
  };

  const obtenerEstadoGPIO = (gpio) => {
    if (conflictos.includes(gpio)) return 'conflicto';
    if (!gpiosUsados[gpio]) return 'libre';
    if (gpiosUsados[gpio].includes('sensor')) return 'sensor';
    if (gpiosUsados[gpio].includes('actuador')) return 'actuador';
    return 'libre';
  };

  const obtenerClaseGPIO = (gpio) => {
    const estado = obtenerEstadoGPIO(gpio);
    let clase = `gpio-pin gpio-${estado}`;
    
    if (ESP32_GPIOS.inputOnly.includes(gpio)) clase += ' gpio-input-only';
    if (ESP32_GPIOS.restricted.includes(gpio)) clase += ' gpio-restricted';
    if (ESP32_GPIOS.strapping.includes(gpio)) clase += ' gpio-strapping';
    
    return clase;
  };

  const obtenerTooltip = (gpio) => {
    const pinInfo = ESP32_PIN_INFO[gpio];
    let info = pinInfo ? `${pinInfo.name}` : `GPIO ${gpio}`;
    
    if (pinInfo) {
      info += `\n${pinInfo.alt.join(', ')}`;
      if (pinInfo.note) {
        info += `\n⚠️ ${pinInfo.note}`;
      }
    }
    
    if (ESP32_GPIOS.inputOnly.includes(gpio)) {
      info += '\n📥 Solo entrada - ADC';
    }
    if (ESP32_GPIOS.restricted.includes(gpio)) {
      info += '\n🚫 Restringido - Flash SPI';
    }
    if (ESP32_GPIOS.strapping.includes(gpio)) {
      info += '\n⚡ Strapping - Cuidado al boot';
    }
    
    // Información de asignación
    const asignacion = obtenerAsignacionGPIO(gpio);
    if (asignacion) {
      info += `\n\n💡 ${asignacion.tipo === 'sensor' ? '📡 SENSOR' : '⚡ ACTUADOR'} ASIGNADO:`;
      info += `\n📌 ${asignacion.definicionNombre || 'Sin nombre'}`;
      if (asignacion.alias) {
        info += `\n🏷️ Alias: ${asignacion.alias}`;
      }
      if (asignacion.ubicacionEspecifica) {
        info += `\n📍 Ubicación: ${asignacion.ubicacionEspecifica}`;
      }
      if (asignacion.activo === false) {
        info += '\n⚠️ INACTIVO';
      }
    } else if (gpiosUsados[gpio]) {
      info += '\n\n💡 En uso: ' + gpiosUsados[gpio].join(', ');
    } else {
      info += '\n\n✓ Libre';
    }
    
    return info;
  };

  // Renderizar grid de GPIOs del ESP32
  const renderGPIOGrid = () => {
    const gpios = [...ESP32_GPIOS.usable, ...ESP32_GPIOS.inputOnly];
    
    return (
      <Box className="gpio-grid">
        {gpios.map(gpio => {
          const pinInfo = ESP32_PIN_INFO[gpio];
          const asignacion = obtenerAsignacionGPIO(gpio);
          const isRestricted = ESP32_GPIOS.restricted.includes(gpio);
          
          return (
            <Tooltip key={gpio} title={obtenerTooltip(gpio)} arrow>
              <div 
                className={`${obtenerClaseGPIO(gpio)} ${!isRestricted ? 'gpio-clickeable' : ''}`}
                onClick={() => !isRestricted && handleGPIOClick(gpio)}
                style={{ cursor: isRestricted ? 'not-allowed' : 'pointer' }}
              >
                <span className="gpio-number">{gpio}</span>
                {pinInfo && (
                  <>
                    <span className="gpio-name">{pinInfo.name}</span>
                    <span className="gpio-function">{pinInfo.alt[0]}</span>
                  </>
                )}
                {asignacion ? (
                  <span className="gpio-device" title={asignacion.alias || asignacion.definicionNombre}>
                    {asignacion.alias || asignacion.definicionNombre}
                  </span>
                ) : (
                  <span className="gpio-status">{obtenerEstadoGPIO(gpio)}</span>
                )}
              </div>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  return (
    <Box className="gpio-manager">
      {/* Inputs de texto para ingresar GPIOs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <TextField 
            label="GPIOs Sensores (ej: 12,13,14)" 
            variant="outlined" 
            fullWidth 
            value={gpioSensores || ''} 
            onChange={e => onChange('gpioSensores', e.target.value)}
            sx={{
              '& .MuiInputBase-input': { color: '#f5f5f5' },
              '& .MuiInputLabel-root': { color: '#d0d0d0' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField 
            label="GPIOs Actuadores (ej: 15,16,17)" 
            variant="outlined" 
            fullWidth 
            value={gpioActuadores || ''} 
            onChange={e => onChange('gpioActuadores', e.target.value)}
            sx={{
              '& .MuiInputBase-input': { color: '#f5f5f5' },
              '& .MuiInputLabel-root': { color: '#d0d0d0' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField 
            label="GPIOs Libres (reservados)" 
            variant="outlined" 
            fullWidth 
            value={gpioLibres || ''} 
            onChange={e => onChange('gpioLibres', e.target.value)}
            sx={{
              '& .MuiInputBase-input': { color: '#f5f5f5' },
              '& .MuiInputLabel-root': { color: '#d0d0d0' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
            }}
          />
        </Grid>
      </Grid>

      {/* Conflictos */}
      {conflictos.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#2d1f1f', border: '1px solid #dc2626' }}>
          <Typography variant="body2" sx={{ color: '#fca5a5', mb: 1 }}>
            ⚠️ <strong>Conflictos detectados:</strong> Los siguientes GPIOs están asignados a múltiples usos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {conflictos.map(gpio => (
              <Chip 
                key={gpio} 
                label={`GPIO ${gpio}`} 
                size="small" 
                sx={{ bgcolor: '#dc2626', color: '#fff' }} 
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Leyenda */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ color: '#d0d0d0', fontWeight: 'bold' }}>Leyenda:</Typography>
        <Chip label="Libre" size="small" className="legend-libre" />
        <Chip label="Sensor" size="small" className="legend-sensor" />
        <Chip label="Actuador" size="small" className="legend-actuador" />
        <Chip label="Conflicto" size="small" className="legend-conflicto" />
        <Chip label="Input Only" size="small" className="legend-input-only" />
      </Box>

      {/* Grid de GPIOs */}
      <Paper sx={{ p: 2, bgcolor: '#1a1f2e', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#d0d0d0' }}>
            Mapa de GPIOs ESP32
          </Typography>
          {cargando && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} sx={{ color: '#7dd3fc' }} />
              <Typography variant="caption" sx={{ color: '#888' }}>
                Cargando asignaciones...
              </Typography>
            </Box>
          )}
        </Box>
        {renderGPIOGrid()}
        <Typography variant="caption" sx={{ color: '#888', mt: 2, display: 'block' }}>
          💡 Haz clic en cualquier GPIO para asignar un sensor o actuador
        </Typography>
      </Paper>

      {/* Imagen de referencia del pinout */}
      <Paper sx={{ p: 2, bgcolor: '#1a1f2e' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#d0d0d0' }}>
            Diagrama de Pines ESP32
          </Typography>
          <Chip 
            label={mostrarImagen ? 'Ocultar' : 'Mostrar'} 
            size="small" 
            onClick={() => setMostrarImagen(!mostrarImagen)}
            sx={{ cursor: 'pointer' }}
          />
        </Box>
        {mostrarImagen && (
          <Box sx={{ textAlign: 'center', bgcolor: '#0f1419', p: 2, borderRadius: '8px' }}>
            <img 
              src="/esp32_pinout.png" 
              alt="ESP32 Pinout" 
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                borderRadius: '8px',
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
              }} 
            />
          </Box>
        )}
      </Paper>

      {/* Modal de asignación de dispositivo a GPIO */}
      <Dialog 
        open={modalAbierto} 
        onClose={cerrarModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1a1f2e',
            color: '#f5f5f5',
            borderRadius: '12px',
            maxHeight: '60vh',
            m: 2,
            position: 'fixed'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #394150',
          pb: 2,
          flexShrink: 0,
          bgcolor: '#1a1f2e'
        }}>
          <Box>
            <Typography variant="h6" sx={{ color: '#7dd3fc' }}>
              {obtenerAsignacionGPIO(gpioSeleccionado) ? 'Editar' : 'Asignar'} GPIO {gpioSeleccionado}
            </Typography>
            {ESP32_PIN_INFO[gpioSeleccionado] && (
              <Typography variant="caption" sx={{ color: '#888' }}>
                {ESP32_PIN_INFO[gpioSeleccionado].name} - {ESP32_PIN_INFO[gpioSeleccionado].alt[0]}
              </Typography>
            )}
          </Box>
          <IconButton onClick={cerrarModal} sx={{ color: '#888' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ 
          pt: 3, 
          pb: 2
        }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Selector de tipo de dispositivo */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel sx={{ color: '#d0d0d0' }}>Tipo de Dispositivo</InputLabel>
            <Select
              value={tipoDispositivo}
              onChange={(e) => setTipoDispositivo(e.target.value)}
              disabled={!!obtenerAsignacionGPIO(gpioSeleccionado)}
              MenuProps={{
                disableScrollLock: true,
                PaperProps: {
                  sx: {
                    bgcolor: '#1a1f2e',
                    maxHeight: 120,
                    '& .MuiMenuItem-root': {
                      color: '#f5f5f5',
                      py: 1.5,
                      '&:hover': {
                        bgcolor: '#2d3748'
                      },
                      '&.Mui-selected': {
                        bgcolor: '#394150',
                        '&:hover': {
                          bgcolor: '#4a5568'
                        }
                      }
                    }
                  }
                }
              }}
              sx={{
                color: '#f5f5f5',
                '.MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' },
                '.MuiSvgIcon-root': { color: '#888' }
              }}
            >
              <MenuItem value="sensor">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SensorsIcon sx={{ fontSize: 20, color: '#10b981' }} />
                  Sensor
                </Box>
              </MenuItem>
              <MenuItem value="actuador">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PowerIcon sx={{ fontSize: 20, color: '#f59e0b' }} />
                  Actuador
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Selector de definición */}
          {tipoDispositivo && (
            <>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ color: '#d0d0d0' }}>
                  {tipoDispositivo === 'sensor' ? 'Sensor' : 'Actuador'}
                </InputLabel>
                <Select
                  value={definicionSeleccionada}
                  onChange={(e) => setDefinicionSeleccionada(e.target.value)}
                  MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                      sx: {
                        bgcolor: '#1a1f2e',
                        maxHeight: 180,
                        '& .MuiMenuItem-root': {
                          color: '#f5f5f5',
                          py: 1.5,
                          '&:hover': {
                            bgcolor: '#2d3748'
                          },
                          '&.Mui-selected': {
                            bgcolor: '#394150',
                            '&:hover': {
                              bgcolor: '#4a5568'
                            }
                          }
                        }
                      }
                    }
                  }}
                  sx={{
                    color: '#f5f5f5',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' },
                    '.MuiSvgIcon-root': { color: '#888' }
                  }}
                >
                  {definicionesDisponibles.map(def => (
                    <MenuItem key={def.id} value={def.id}>
                      <Box>
                        <Typography variant="body2">{def.nombre}</Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          {def.modelo} - {def.tipo}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2, borderColor: '#394150' }} />

              {/* Campos opcionales */}
              <TextField
                label="Alias (opcional)"
                fullWidth
                value={aliasDispositivo}
                onChange={(e) => setAliasDispositivo(e.target.value)}
                placeholder="Ej: Sensor Cocina Principal"
                sx={{
                  mb: 2,
                  '& .MuiInputBase-input': { color: '#f5f5f5' },
                  '& .MuiInputLabel-root': { color: '#d0d0d0' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' }
                }}
              />

              <TextField
                label="Ubicación Específica (opcional)"
                fullWidth
                value={ubicacionDispositivo}
                onChange={(e) => setUbicacionDispositivo(e.target.value)}
                placeholder="Ej: Pared norte, junto a ventana"
                multiline
                rows={2}
                sx={{
                  '& .MuiInputBase-input': { color: '#f5f5f5' },
                  '& .MuiInputLabel-root': { color: '#d0d0d0' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' }
                }}
              />
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ 
          px: 3, 
          pb: 3, 
          pt: 2,
          gap: 1,
          flexShrink: 0,
          bgcolor: '#1a1f2e',
          borderTop: '1px solid #394150'
        }}>
          {obtenerAsignacionGPIO(gpioSeleccionado) && (
            <Button
              onClick={eliminarAsignacion}
              disabled={guardando}
              sx={{
                color: '#ef4444',
                borderColor: '#ef4444',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: '#dc2626' }
              }}
              variant="outlined"
            >
              Eliminar
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={cerrarModal} disabled={guardando} sx={{ color: '#888' }}>
            Cancelar
          </Button>
          <Button
            onClick={guardarAsignacion}
            disabled={guardando || !tipoDispositivo || !definicionSeleccionada}
            variant="contained"
            sx={{
              bgcolor: '#7dd3fc',
              color: '#0f1419',
              '&:hover': { bgcolor: '#38bdf8' },
              '&:disabled': { bgcolor: '#394150', color: '#666' }
            }}
          >
            {guardando ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GPIOManager;
