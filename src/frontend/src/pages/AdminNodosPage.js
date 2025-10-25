// Página para administrar nodos del sistema con sensores y actuadores
import React, { useMemo, useRef, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { TextField, Grid, Card, CardContent, Button, Typography, Tabs, Tab, Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ListaNodos from '../components/ListaNodos';
import BibliotecaSensores from '../components/BibliotecaSensores';
import BibliotecaActuadores from '../components/BibliotecaActuadores';
import GestionDispositivosNodo from '../components/GestionDispositivosNodo';
import GPIOManager from '../components/GPIOManager';
import WebFlasher from '../components/WebFlasher';
import SerialMonitor from '../components/SerialMonitor';
import '../styles/theme.css';
import '../styles/AdminNodosPage.css';
import { createNode } from '../services/nodeService';

function AdminNodosPage() {
  // (declaración única más abajo)
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  // Cuando seleccionas un nodo para editar, pobla el formulario con todos los campos, incluyendo red ampliada
  React.useEffect(() => {
    if (nodoSeleccionado) {
      setVistaActual('nuevo');
      setTabFormIdx(0);
      setNuevoNodo({
        nombre: nodoSeleccionado.nombre || '',
        tipo: nodoSeleccionado.tipo || '',
        ubicacion: nodoSeleccionado.ubicacion || '',
        descripcion: nodoSeleccionado.descripcion || '',
        macAddress: nodoSeleccionado.macAddress || '',
        ipAddress: nodoSeleccionado.ipAddress || '',
        firmwareVersion: nodoSeleccionado.firmwareVersion || '',
        tags: Array.isArray(nodoSeleccionado.tags) ? nodoSeleccionado.tags.join(', ') : (nodoSeleccionado.tags || ''),
        // Red ampliada
        failover: nodoSeleccionado.failover || '',
        ssid: nodoSeleccionado.ssid || '',
        wifiPass: nodoSeleccionado.wifiPass || '',
        canal: nodoSeleccionado.canal || '',
        tipoIP: nodoSeleccionado.tipoIP || '',
        ipFija: nodoSeleccionado.ipFija || '',
        mascara: nodoSeleccionado.mascara || '',
        gateway: nodoSeleccionado.gateway || '',
        dns: nodoSeleccionado.dns || '',
        frecuenciaLora: nodoSeleccionado.frecuenciaLora || '',
        canalLora: nodoSeleccionado.canalLora || '',
        potenciaLora: nodoSeleccionado.potenciaLora || ''
      });
    }
  }, [nodoSeleccionado]);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const mostrarSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar({ ...snackbar, open: false });
  };
  const [vistaActual, setVistaActual] = useState('nodos'); // 'nodos', 'nuevo', 'sensores', 'actuadores', 'dispositivos'

  const [nuevoNodo, setNuevoNodo] = useState({
    nombre: '', tipo: '', ubicacion: '', descripcion: '', macAddress: '', ipAddress: '', firmwareVersion: '', tags: '',
    // Red ampliada
    failover: '',
    ssid: '',
    wifiPass: '',
    canal: '',
    tipoIP: '',
    ipFija: '',
    mascara: '',
    gateway: '',
    dns: '',
    frecuenciaLora: '',
    canalLora: '',
    potenciaLora: ''
  });
  const [errores, setErrores] = useState({});
  const [tabFormIdx, setTabFormIdx] = useState(0); // 0: Datos, 1: Red, 2: GPIOs

  // Estados para WebFlasher
  const [webFlasherOpen, setWebFlasherOpen] = useState(false);
  const [firmwareBinario, setFirmwareBinario] = useState(null);

  // Estados para SerialMonitor
  const [serialMonitorOpen, setSerialMonitorOpen] = useState(false);

  const manejarGestionDispositivos = (nodo) => {
    setNodoSeleccionado(nodo);
    setVistaActual('dispositivos');
  };

  const volverANodos = () => {
    setNodoSeleccionado(null);
    setVistaActual('nodos');
  };

  // Funciones para WebFlasher  
  const manejarFlashearNodo = async (nodo) => {
    console.log('🔥 manejarFlashearNodo llamada con nodo:', nodo);
    
    // Abrir WebFlasher directamente sin generar firmware binario
    setNodoSeleccionado(nodo);
    setWebFlasherOpen(true);
    
    // Opcional: intentar generar firmware en background sin bloquear la UI
    try {
      const response = await fetch(`/api/nodos/${nodo.id}/generar-firmware-binario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wifiSSID: 'RFX_NET',
          wifiPassword: '01010101xxxx',
          serverIP: '192.168.1.100'
        })
      });
      
      if (response.ok) {
        const firmwareBin = await response.blob();
        setFirmwareBinario(firmwareBin);
        console.log('✓ Firmware binario generado');
      } else {
        console.log('⚠️ Error generando firmware, usando modo manual');
      }
    } catch (error) {
      console.log('⚠️ Error conectando backend, usando modo manual:', error);
    }
  };

  const cerrarWebFlasher = () => {
    setWebFlasherOpen(false);
    setFirmwareBinario(null);
  };

  // Función para abrir monitor serial
  const manejarMonitorSerial = () => {
    setSerialMonitorOpen(true);
  };

  const cerrarSerialMonitor = () => {
    setSerialMonitorOpen(false);
  };

  // Tema local para forzar tipografía clara en el formulario
  const formTheme = createTheme({
    palette: { mode: 'dark' },
    components: {
      MuiInputLabel: { styleOverrides: { root: { color: '#eaeaea' } } },
      MuiFormLabel: { styleOverrides: { root: { color: '#eaeaea' } } },
      MuiOutlinedInput: {
        styleOverrides: {
          input: { color: '#f5f5f5' },
          notchedOutline: { borderColor: '#394150' },
          root: {
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
          }
        }
      },
      MuiSelect: { styleOverrides: { select: { color: '#f5f5f5' }, icon: { color: '#f5f5f5' } } },
      MuiMenu: { styleOverrides: { paper: { maxHeight: 300 } } }
    }
  });

  const isValidIP = (ip) => {
    if (!ip) return true; // opcional
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every((p) => {
      if (!/^\d{1,3}$/.test(p)) return false;
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  };

  const isValidMAC = (mac) => {
    if (!mac) return true; // opcional
    return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac.trim());
  };

  const parseGPIOs = (str) => {
    if (!str) return [];
    return str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n));
  };

  const validar = useMemo(() => (data) => {
    const errs = {};
    if (!data.nombre?.trim()) errs.nombre = 'Requerido';
    if (!data.tipo?.trim()) errs.tipo = 'Requerido';
    if (!data.ubicacion?.trim()) errs.ubicacion = 'Requerido';

    if (data.ipAddress && !isValidIP(data.ipAddress)) errs.ipAddress = 'IP inválida';
    if (data.macAddress && !isValidMAC(data.macAddress)) errs.macAddress = 'MAC inválida (formato AA:BB:CC:DD:EE:FF)';

    if (data.failover === 'wifi') {
      if (!data.ssid?.trim()) errs.ssid = 'SSID requerido';
      if (!data.wifiPass?.trim()) errs.wifiPass = 'Clave requerida';
    }
    if (data.failover === 'espnow' || data.failover === 'lora') {
      if (!data.canal?.toString().trim()) errs.canal = 'Canal requerido';
    }

    const allGpios = [
      ...parseGPIOs(data.gpioSensores),
      ...parseGPIOs(data.gpioActuadores),
      ...parseGPIOs(data.gpioLibres)
    ];
    const outOfRange = allGpios.filter((n) => n < 0 || n > 39);
    if (outOfRange.length) {
      errs.gpios = 'GPIO fuera de rango (permitidos 0-39 en ESP32)';
    }
    return errs;
  }, []);

  const guardarNuevoNodo = async (e) => {
    e.preventDefault();
    const errs = validar(nuevoNodo);
    setErrores(errs);
    if (Object.keys(errs).length) {
      // Cambiar a la pestaña con el primer error
      const keysDatos = ['nombre', 'tipo', 'ubicacion', 'descripcion', 'macAddress', 'ipAddress', 'firmwareVersion', 'tags'];
      const keysRed = ['failover', 'ssid', 'wifiPass', 'canal'];
      const keysGPIO = ['gpioSensores', 'gpioActuadores', 'gpioLibres', 'gpios'];
      const firstKey = Object.keys(errs)[0];
      if (keysDatos.includes(firstKey)) setTabFormIdx(0);
      else if (keysRed.includes(firstKey)) setTabFormIdx(1);
      else if (keysGPIO.includes(firstKey)) setTabFormIdx(2);
      return;
    }

    try {
      await createNode(nuevoNodo);
      alert('Nodo guardado exitosamente');
      setVistaActual('nodos');
      setNuevoNodo({ nombre: '', tipo: '', ubicacion: '', descripcion: '', macAddress: '', ipAddress: '', firmwareVersion: '', tags: '' });
      setErrores({});
    } catch (err) {
      console.error('Error creando nodo:', err);
      alert('Error al guardar el nodo');
    }
  };

  // Contenedor para anclar el menú del Select dentro del card y evitar que "se vaya" la pantalla
  const menuContainerRef = useRef(null);

  return (
    <div className="admin-nodos-page">
      <h2>Administrar Nodos del Sistema</h2>
      {/* Navegación por pestañas */}
      <div className="tabs-navegacion">
        <button 
          className={vistaActual === 'nodos' ? 'tab-activo' : 'tab'}
          onClick={() => setVistaActual('nodos')}
        >
          Nodos
        </button>
        <button 
          className={vistaActual === 'nuevo' ? 'tab-activo' : 'tab'}
          onClick={() => setVistaActual('nuevo')}
        >
          Nuevo Nodo
        </button>
        <button 
          className={vistaActual === 'sensores' ? 'tab-activo' : 'tab'}
          onClick={() => setVistaActual('sensores')}
        >
          Sensores
        </button>
        <button 
          className={vistaActual === 'actuadores' ? 'tab-activo' : 'tab'}
          onClick={() => setVistaActual('actuadores')}
        >
          Actuadores
        </button>
      </div>

      {/* Contenido según vista actual */}
      {vistaActual === 'nodos' && (
        <div className="vista-nodos">
          <ListaNodos 
            onGestionarDispositivos={manejarGestionDispositivos}
            onFlashearNodo={manejarFlashearNodo}
            onMonitorSerial={manejarMonitorSerial}
            mostrarSnackbar={mostrarSnackbar}
          />
      {/* Snackbar de feedback visual */}
      <Snackbar open={snackbar.open} autoHideDuration={3500} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} elevation={6} variant="filled">
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
        </div>
      )}

      {vistaActual === 'dispositivos' && nodoSeleccionado && (
        <div className="vista-dispositivos">
          <GestionDispositivosNodo 
            nodo={nodoSeleccionado}
            onVolver={volverANodos}
          />
        </div>
      )}

      {vistaActual === 'nuevo' && (
        <ThemeProvider theme={formTheme}>
          <Card sx={{marginTop: 4, maxWidth: 900, marginX: 'auto', backgroundColor: 'transparent', boxShadow: 'none', border: '1px solid #2a2f3a'}}>
            <CardContent ref={menuContainerRef}>
              <Typography variant="h5" gutterBottom sx={{color: '#e6e6e6', mb: 3}}>Nuevo Nodo</Typography>
              
              <Tabs 
                value={tabFormIdx} 
                onChange={(_, v) => setTabFormIdx(v)} 
                textColor="inherit" 
                TabIndicatorProps={{ style: { backgroundColor: '#60a5fa', height: 2 } }} 
                sx={{ 
                  mb: 3,
                  borderBottom: 1,
                  borderColor: '#394150',
                  '& .MuiTabs-flexContainer': {
                    gap: 0.5
                  },
                  '& .MuiTab-root': {
                    color: '#94a3b8',
                    minHeight: '44px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    px: 2.5,
                    minWidth: 'auto',
                    backgroundColor: 'transparent',
                    '&:hover': {
                      color: '#cbd5e1',
                      backgroundColor: 'transparent'
                    }
                  },
                  '& .Mui-selected': {
                    color: '#60a5fa !important',
                    fontWeight: 600,
                    backgroundColor: 'transparent !important'
                  }
                }}
              >
                <Tab label="Datos" />
                <Tab label="Red" />
                <Tab label="GPIOs" />
              </Tabs>

              <form onSubmit={guardarNuevoNodo}>
              {tabFormIdx === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField label="Nombre" variant="outlined" fullWidth required value={nuevoNodo.nombre} onChange={e => setNuevoNodo({...nuevoNodo, nombre: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }}
                    error={Boolean(errores.nombre)} helperText={errores.nombre}
                  />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Tipo (ej: ESP32, ESP8266)" variant="outlined" fullWidth required value={nuevoNodo.tipo} onChange={e => setNuevoNodo({...nuevoNodo, tipo: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }}
                    error={Boolean(errores.tipo)} helperText={errores.tipo}
                  />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Ubicación" variant="outlined" fullWidth required value={nuevoNodo.ubicacion} onChange={e => setNuevoNodo({...nuevoNodo, ubicacion: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }}
                    error={Boolean(errores.ubicacion)} helperText={errores.ubicacion}
                  />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="MAC Address" variant="outlined" fullWidth value={nuevoNodo.macAddress} onChange={e => setNuevoNodo({...nuevoNodo, macAddress: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }}
                    error={Boolean(errores.macAddress)} helperText={errores.macAddress}
                  />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="IP Address" variant="outlined" fullWidth value={nuevoNodo.ipAddress} onChange={e => setNuevoNodo({...nuevoNodo, ipAddress: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }}
                    error={Boolean(errores.ipAddress)} helperText={errores.ipAddress}
                  />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Versión de firmware" variant="outlined" fullWidth value={nuevoNodo.firmwareVersion} onChange={e => setNuevoNodo({...nuevoNodo, firmwareVersion: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField label="Descripción, IP, notas, etc." variant="outlined" fullWidth multiline minRows={2} value={nuevoNodo.descripcion} onChange={e => setNuevoNodo({...nuevoNodo, descripcion: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField label="Tags (separados por coma)" variant="outlined" fullWidth value={nuevoNodo.tags} onChange={e => setNuevoNodo({...nuevoNodo, tags: e.target.value})}
                    sx={{
                      '& .MuiInputBase-input': { color: '#f5f5f5' },
                      '& .MuiInputLabel-root': { color: '#d0d0d0' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                    }} />
                  </Grid>
                </Grid>
              )}

              {tabFormIdx === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      required
                      label="Modo de Red"
                      variant="outlined"
                      value={nuevoNodo.failover || ''}
                      onChange={e => setNuevoNodo({ ...nuevoNodo, failover: e.target.value })}
                      SelectProps={{ native: true }}
                      InputLabelProps={{ shrink: true }}
                      error={Boolean(errores.failover)}
                      helperText={errores.failover}
                      sx={{
                        '& .MuiInputBase-input': { color: '#f5f5f5' },
                        '& .MuiInputLabel-root': { color: '#d0d0d0' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                      }}
                    >
                      <option value="">Seleccionar modo de red</option>
                      <option value="wifi">WiFi</option>
                      <option value="espnow">ESP-NOW</option>
                      <option value="lora">LoRa</option>
                    </TextField>
                  </Grid>
                  {nuevoNodo.failover === 'wifi' && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField label="SSID WiFi" variant="outlined" fullWidth value={nuevoNodo.ssid || ''} onChange={e => setNuevoNodo({...nuevoNodo, ssid: e.target.value})}
                          sx={{
                            '& .MuiInputBase-input': { color: '#f5f5f5' },
                            '& .MuiInputLabel-root': { color: '#d0d0d0' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                          }}
                          error={Boolean(errores.ssid)} helperText={errores.ssid}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField label="Clave WiFi" variant="outlined" fullWidth type="password" value={nuevoNodo.wifiPass || ''} onChange={e => setNuevoNodo({...nuevoNodo, wifiPass: e.target.value})}
                          sx={{
                            '& .MuiInputBase-input': { color: '#f5f5f5' },
                            '& .MuiInputLabel-root': { color: '#d0d0d0' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                          }}
                          error={Boolean(errores.wifiPass)} helperText={errores.wifiPass}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField select fullWidth label="Tipo de IP" variant="outlined" value={nuevoNodo.tipoIP || ''} onChange={e => setNuevoNodo({...nuevoNodo, tipoIP: e.target.value})}
                          SelectProps={{ native: true }}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiInputBase-input': { color: '#f5f5f5' },
                            '& .MuiInputLabel-root': { color: '#d0d0d0' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                          }}
                        >
                          <option value="">Tipo de IP</option>
                          <option value="dhcp">DHCP</option>
                          <option value="fija">Fija</option>
                        </TextField>
                      </Grid>
                      {nuevoNodo.tipoIP === 'fija' && (
                        <>
                          <Grid item xs={12} md={6}>
                            <TextField label="IP Fija" variant="outlined" fullWidth value={nuevoNodo.ipFija || ''} onChange={e => setNuevoNodo({...nuevoNodo, ipFija: e.target.value})}
                              sx={{
                                '& .MuiInputBase-input': { color: '#f5f5f5' },
                                '& .MuiInputLabel-root': { color: '#d0d0d0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField label="Máscara" variant="outlined" fullWidth value={nuevoNodo.mascara || ''} onChange={e => setNuevoNodo({...nuevoNodo, mascara: e.target.value})}
                              sx={{
                                '& .MuiInputBase-input': { color: '#f5f5f5' },
                                '& .MuiInputLabel-root': { color: '#d0d0d0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField label="Gateway" variant="outlined" fullWidth value={nuevoNodo.gateway || ''} onChange={e => setNuevoNodo({...nuevoNodo, gateway: e.target.value})}
                              sx={{
                                '& .MuiInputBase-input': { color: '#f5f5f5' },
                                '& .MuiInputLabel-root': { color: '#d0d0d0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                              }}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField label="DNS" variant="outlined" fullWidth value={nuevoNodo.dns || ''} onChange={e => setNuevoNodo({...nuevoNodo, dns: e.target.value})}
                              sx={{
                                '& .MuiInputBase-input': { color: '#f5f5f5' },
                                '& .MuiInputLabel-root': { color: '#d0d0d0' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                              }}
                            />
                          </Grid>
                        </>
                      )}
                    </>
                  )}
                  {nuevoNodo.failover === 'lora' && (
                    <>
                      <Grid item xs={12} md={4}>
                        <TextField label="Frecuencia LoRa" variant="outlined" fullWidth value={nuevoNodo.frecuenciaLora || ''} onChange={e => setNuevoNodo({...nuevoNodo, frecuenciaLora: e.target.value})}
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
                        <TextField label="Canal LoRa" variant="outlined" fullWidth value={nuevoNodo.canalLora || ''} onChange={e => setNuevoNodo({...nuevoNodo, canalLora: e.target.value})}
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
                        <TextField label="Potencia LoRa" variant="outlined" fullWidth value={nuevoNodo.potenciaLora || ''} onChange={e => setNuevoNodo({...nuevoNodo, potenciaLora: e.target.value})}
                          sx={{
                            '& .MuiInputBase-input': { color: '#f5f5f5' },
                            '& .MuiInputLabel-root': { color: '#d0d0d0' },
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                          }}
                        />
                      </Grid>
                    </>
                  )}
                  {(nuevoNodo.failover === 'espnow' || nuevoNodo.failover === 'lora') && (
                    <Grid item xs={12} md={6}>
                      <TextField label="Canal ESP-NOW/LoRa" variant="outlined" fullWidth value={nuevoNodo.canal || ''} onChange={e => setNuevoNodo({...nuevoNodo, canal: e.target.value})}
                        sx={{
                          '& .MuiInputBase-input': { color: '#f5f5f5' },
                          '& .MuiInputLabel-root': { color: '#d0d0d0' },
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
                          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
                        }}
                        error={Boolean(errores.canal)} helperText={errores.canal}
                      />
                    </Grid>
                  )}
                </Grid>
              )}

              {tabFormIdx === 2 && (
                <GPIOManager
                  gpioSensores={nuevoNodo.gpioSensores}
                  gpioActuadores={nuevoNodo.gpioActuadores}
                  gpioLibres={nuevoNodo.gpioLibres}
                  tipoNodo={nuevoNodo.tipo}
                  onChange={(field, value) => setNuevoNodo({...nuevoNodo, [field]: value})}
                />
              )}

              <Box sx={{ mt: 3 }}>
                <Button type="submit" variant="contained" color="primary">Guardar Nodo</Button>
              </Box>
            </form>
            </CardContent>
          </Card>
        </ThemeProvider>
      )}

      {vistaActual === 'sensores' && (
        <div className="vista-sensores">
          <BibliotecaSensores />
        </div>
      )}

      {vistaActual === 'actuadores' && (
        <div className="vista-actuadores">
          <BibliotecaActuadores />
        </div>
      )}

      {/* WebFlasher Dialog */}
      <WebFlasher
        open={webFlasherOpen}
        onClose={cerrarWebFlasher}
        nodo={nodoSeleccionado}
        firmwareBinario={firmwareBinario}
      />

      {/* SerialMonitor Dialog */}
      <SerialMonitor
        open={serialMonitorOpen}
        onClose={cerrarSerialMonitor}
      />
    </div>
  );
}

export default AdminNodosPage;
