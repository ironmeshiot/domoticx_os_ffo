// Componente para editar los datos básicos de un nodo
import React, { useState } from 'react';
import { Card, CardContent, TextField, Grid, Tabs, Tab, Box, Button } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GPIOManager from './GPIOManager';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: { paper: '#1a1f2e', default: '#0f1419' },
    text: { primary: '#f5f5f5', secondary: '#d0d0d0' }
  }
});

function NodoConfig({ nodo, onGuardar, onCancelar }) {
  const [tabIdx, setTabIdx] = useState(0);
  const [formulario, setFormulario] = useState({
    nombre: nodo.nombre || '',
    tipo: nodo.tipo || '',
    ubicacion: nodo.ubicacion || '',
    descripcion: nodo.descripcion || '',
    macAddress: nodo.macAddress || '',
    ipAddress: nodo.ipAddress || '',
    firmwareVersion: nodo.firmwareVersion || '',
    estado: nodo.estado || 'offline',
    tags: Array.isArray(nodo.tags) ? nodo.tags.join(', ') : '',
    failover: nodo.failover || '',
    ssid: nodo.ssid || '',
    wifiPass: nodo.wifiPass || '',
    tipoIP: nodo.tipoIP || 'dhcp',
    ipFija: nodo.ipFija || '',
    mascara: nodo.mascara || '',
    gateway: nodo.gateway || '',
    dns: nodo.dns || '',
    frecuenciaLora: nodo.frecuenciaLora || '',
    canalLora: nodo.canalLora || '',
    potenciaLora: nodo.potenciaLora || '',
    canal: nodo.canal || '',
    gpioSensores: nodo.gpioSensores || '',
    gpioActuadores: nodo.gpioActuadores || '',
    gpioLibres: nodo.gpioLibres || ''
  });

  const manejarCambio = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const manejarSubmit = (e) => {
    e.preventDefault();
    const payload = {
      id: nodo.id,
      nombre: formulario.nombre,
      tipo: formulario.tipo,
      ubicacion: formulario.ubicacion,
      descripcion: formulario.descripcion,
      macAddress: formulario.macAddress,
      ipAddress: formulario.ipAddress,
      firmwareVersion: formulario.firmwareVersion,
      estado: formulario.estado,
      failover: formulario.failover,
      ssid: formulario.ssid,
      wifiPass: formulario.wifiPass,
      canal: formulario.canal,
      gpioSensores: formulario.gpioSensores,
      gpioActuadores: formulario.gpioActuadores,
      gpioLibres: formulario.gpioLibres,
      tags: formulario.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    };
    onGuardar(payload);
  };

  const fieldStyle = {
    '& .MuiInputBase-input': { color: '#f5f5f5' },
    '& .MuiInputLabel-root': { color: '#d0d0d0' },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#394150' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#5b6474' },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#7dd3fc' }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Box sx={{ 
        position: 'relative',
        mt: 3,
        mb: 3,
        clear: 'both'
      }}>
        <Card sx={{ 
          bgcolor: '#1a1f2e', 
          border: '1px solid #394150',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <h4 style={{ color: '#f5f5f5', marginBottom: '1.5rem', marginTop: 0 }}>
              Editar Nodo: {nodo.nombre}
            </h4>
          
          <Tabs 
            value={tabIdx} 
            onChange={(e, val) => setTabIdx(val)}
            sx={{ 
              borderBottom: 1, 
              borderColor: '#394150',
              mb: 3,
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
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#60a5fa',
                height: 2
              }
            }}
          >
            <Tab label="Datos" />
            <Tab label="Red" />
            <Tab label="GPIOs" />
          </Tabs>

          <form onSubmit={manejarSubmit}>
            {/* Pestaña Datos */}
            {tabIdx === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Nombre del nodo" 
                    variant="outlined" 
                    fullWidth 
                    required
                    value={formulario.nombre}
                    onChange={(e) => manejarCambio('nombre', e.target.value)}
                    sx={fieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    select
                    label="Tipo / Plataforma" 
                    variant="outlined" 
                    fullWidth 
                    required
                    value={formulario.tipo}
                    onChange={(e) => manejarCambio('tipo', e.target.value)}
                    SelectProps={{ MenuProps: { container: typeof document !== 'undefined' ? document.body : undefined } }}
                    sx={fieldStyle}
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="ESP32">ESP32</option>
                    <option value="ESP8266">ESP8266</option>
                    <option value="ESPHome">ESPHome</option>
                    <option value="Modbus">Modbus RTU/TCP</option>
                    <option value="Otro">Otro</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Ubicación" 
                    variant="outlined" 
                    fullWidth 
                    required
                    value={formulario.ubicacion}
                    onChange={(e) => manejarCambio('ubicacion', e.target.value)}
                    placeholder="Habitación, perímetro, tablero..."
                    sx={fieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    select
                    label="Estado actual" 
                    variant="outlined" 
                    fullWidth
                    value={formulario.estado}
                    onChange={(e) => manejarCambio('estado', e.target.value)}
                    SelectProps={{ MenuProps: { container: typeof document !== 'undefined' ? document.body : undefined } }}
                    sx={fieldStyle}
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="error">Error</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Dirección MAC" 
                    variant="outlined" 
                    fullWidth
                    value={formulario.macAddress}
                    onChange={(e) => manejarCambio('macAddress', e.target.value)}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    sx={fieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Dirección IP" 
                    variant="outlined" 
                    fullWidth
                    value={formulario.ipAddress}
                    onChange={(e) => manejarCambio('ipAddress', e.target.value)}
                    placeholder="192.168.0.X"
                    sx={fieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Versión de firmware" 
                    variant="outlined" 
                    fullWidth
                    value={formulario.firmwareVersion}
                    onChange={(e) => manejarCambio('firmwareVersion', e.target.value)}
                    placeholder="v1.2.3"
                    sx={fieldStyle}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="Descripción / Notas" 
                    variant="outlined" 
                    fullWidth 
                    multiline 
                    minRows={2}
                    value={formulario.descripcion}
                    onChange={(e) => manejarCambio('descripcion', e.target.value)}
                    placeholder="Detalles técnicos, referencias..."
                    sx={fieldStyle}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField 
                    label="Tags (separados por coma)" 
                    variant="outlined" 
                    fullWidth
                    value={formulario.tags}
                    onChange={(e) => manejarCambio('tags', e.target.value)}
                    placeholder="seguridad, exterior, iluminación"
                    sx={fieldStyle}
                  />
                </Grid>
              </Grid>
            )}

            {/* Pestaña Red */}
            {tabIdx === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Modo de Red"
                    variant="outlined"
                    value={formulario.failover || ''}
                    onChange={(e) => manejarCambio('failover', e.target.value)}
                    sx={fieldStyle}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{ MenuProps: { container: typeof document !== 'undefined' ? document.body : undefined } }}
                  >
                    <option value="">Seleccionar modo de red</option>
                    <option value="wifi">WiFi</option>
                    <option value="espnow">ESP-NOW</option>
                    <option value="lora">LoRa</option>
                  </TextField>
                </Grid>
                {formulario.failover === 'wifi' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField 
                        label="SSID WiFi" 
                        variant="outlined" 
                        fullWidth 
                        value={formulario.ssid || ''}
                        onChange={(e) => manejarCambio('ssid', e.target.value)}
                        sx={fieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField 
                        label="Clave WiFi" 
                        variant="outlined" 
                        fullWidth 
                        type="password"
                        value={formulario.wifiPass || ''}
                        onChange={(e) => manejarCambio('wifiPass', e.target.value)}
                        sx={fieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        label="Tipo de IP"
                        variant="outlined"
                        fullWidth
                        value={formulario.tipoIP || 'dhcp'}
                        onChange={e => manejarCambio('tipoIP', e.target.value)}
                        SelectProps={{ MenuProps: { container: typeof document !== 'undefined' ? document.body : undefined } }}
                        sx={fieldStyle}
                      >
                        <option value="dhcp">DHCP (automática)</option>
                        <option value="fija">IP Fija</option>
                      </TextField>
                    </Grid>
                    {formulario.tipoIP === 'fija' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField label="IP Fija" variant="outlined" fullWidth value={formulario.ipFija || ''} onChange={e => manejarCambio('ipFija', e.target.value)} placeholder="192.168.1.100" sx={fieldStyle} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField label="Máscara de subred" variant="outlined" fullWidth value={formulario.mascara || ''} onChange={e => manejarCambio('mascara', e.target.value)} placeholder="255.255.255.0" sx={fieldStyle} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField label="Gateway" variant="outlined" fullWidth value={formulario.gateway || ''} onChange={e => manejarCambio('gateway', e.target.value)} placeholder="192.168.1.1" sx={fieldStyle} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField label="DNS" variant="outlined" fullWidth value={formulario.dns || ''} onChange={e => manejarCambio('dns', e.target.value)} placeholder="8.8.8.8" sx={fieldStyle} />
                        </Grid>
                      </>
                    )}
                  </>
                )}
                {formulario.failover === 'lora' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Frecuencia LoRa (MHz)"
                        variant="outlined"
                        fullWidth
                        value={formulario.frecuenciaLora || ''}
                        onChange={e => manejarCambio('frecuenciaLora', e.target.value)}
                        placeholder="916.800"
                        sx={fieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Canal LoRa"
                        variant="outlined"
                        fullWidth
                        value={formulario.canalLora || ''}
                        onChange={e => manejarCambio('canalLora', e.target.value)}
                        placeholder="1"
                        sx={fieldStyle}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Potencia (dBm)"
                        variant="outlined"
                        fullWidth
                        value={formulario.potenciaLora || ''}
                        onChange={e => manejarCambio('potenciaLora', e.target.value)}
                        placeholder="14"
                        sx={fieldStyle}
                      />
                    </Grid>
                  </>
                )}
                {formulario.failover === 'espnow' && (
                  <Grid item xs={12} md={6}>
                    <TextField 
                      label="Canal ESP-NOW" 
                      variant="outlined" 
                      fullWidth 
                      value={formulario.canal || ''}
                      onChange={(e) => manejarCambio('canal', e.target.value)}
                      sx={fieldStyle}
                    />
                  </Grid>
                )}
              </Grid>
            )}

            {/* Pestaña GPIOs */}
            {tabIdx === 2 && (
              <GPIOManager
                gpioSensores={formulario.gpioSensores}
                gpioActuadores={formulario.gpioActuadores}
                gpioLibres={formulario.gpioLibres}
                tipoNodo={formulario.tipo}
                onChange={(field, value) => manejarCambio(field, value)}
              />
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button type="submit" variant="contained" color="primary">
                Guardar cambios
              </Button>
              <Button variant="outlined" onClick={onCancelar}>
                Cancelar
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
      </Box>
    </ThemeProvider>
  );
}

export default NodoConfig;
