// Componente para listar, agregar, editar y eliminar nodos
import React, { useState, useEffect } from 'react';
 

// import Snackbar from '@mui/material/Snackbar';
// import MuiAlert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import NodoConfig from './NodoConfig';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import { getNodes, getNodeById, deleteNode, updateNode } from '../services/nodeService';

function ListaNodos({ onGestionarDispositivos, onFlashearNodo, onMonitorSerial, mostrarSnackbar }) {
  const [confirmSnackbar, setConfirmSnackbar] = useState({ open: false, nodoId: null });
  const [nodos, setNodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nodoEditando, setNodoEditando] = useState(null);
  const [modalFirmware, setModalFirmware] = useState(null);
  const [tipoFirmware, setTipoFirmware] = useState('basic');
  const [serverIP, setServerIP] = useState('192.168.1.100');

  const cargarNodos = async () => {
    setCargando(true);
    try {
      const data = await getNodes();
      setNodos(data);
      setError(null);
    } catch (err) {
      setError('Error cargando nodos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNodos();
  }, []);


  const eliminarNodo = (id) => {
    setConfirmSnackbar({ open: true, nodoId: id });
  };

  const confirmarEliminarNodo = async () => {
    if (!confirmSnackbar.nodoId) return;
    try {
      await deleteNode(confirmSnackbar.nodoId);
      await cargarNodos();
      if (nodoEditando && nodoEditando.id === confirmSnackbar.nodoId) setNodoEditando(null);
      if (mostrarSnackbar) mostrarSnackbar('Nodo eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando nodo:', error);
      if (mostrarSnackbar) mostrarSnackbar('Error al eliminar nodo', 'error');
    } finally {
      setConfirmSnackbar({ open: false, nodoId: null });
    }
  };

  const cancelarEliminarNodo = () => {
    setConfirmSnackbar({ open: false, nodoId: null });
  };

  const descargarFirmware = async (nodo, tipo, ip) => {
    try {
      const response = await fetch(`http://localhost:4000/api/nodos/${nodo.id}/generar-firmware`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ota: tipo === 'ota',
          serverIP: ip || '192.168.1.100'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error generando firmware');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const suffix = tipo === 'ota' ? '_OTA' : '';
      a.download = `${nodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}${suffix}_firmware.ino`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      const mensajeOTA = tipo === 'ota' 
        ? '\n4. Después de la primera carga, podrás actualizar por OTA\n5. Contraseña OTA: domoticx2025'
        : '';
      
      if (mostrarSnackbar) {
        mostrarSnackbar(`✓ Firmware ${tipo === 'ota' ? 'OTA' : 'básico'} generado para ${nodo.nombre}. Recuerda: 1. Editar las credenciales WiFi 2. Instalar las librerías necesarias 3. Compilar y subir al ESP32${mensajeOTA}`,'success');
      }
      setModalFirmware(null);
    } catch (error) {
      console.error('Error descargando firmware:', error);
      if (mostrarSnackbar) mostrarSnackbar('Error al generar firmware', 'error');
    }
  };

  const abrirModalFirmware = (nodo) => {
    setModalFirmware(nodo);
    setTipoFirmware('basic');
    setServerIP('192.168.1.100');
  };

  const guardarConfigNodo = async (nodoActualizado) => {
    try {
      console.log('🔧 Guardando nodo:', JSON.stringify(nodoActualizado, null, 2));
      const { id, ...resto } = nodoActualizado;
      console.log('📤 Enviando datos:', JSON.stringify(resto, null, 2));
      await updateNode(id, resto);
      console.log('✅ Nodo actualizado en backend');
      // Obtener el nodo actualizado con configuración WiFi incluida
      const nodoCompleto = await getNodeById(id);
      console.log('📥 Nodo obtenido después de actualizar:', JSON.stringify(nodoCompleto, null, 2));
      setNodos(nodos.map(n => n.id === id ? nodoCompleto : n));
      setNodoEditando(null);
      if (mostrarSnackbar) mostrarSnackbar('Nodo actualizado exitosamente', 'success');
    } catch (error) {
      console.error('Error actualizando nodo:', error);
      if (mostrarSnackbar) mostrarSnackbar('Error al actualizar nodo', 'error');
    }
  };

  const editarNodo = async (nodo) => {
    try {
      // Obtener el nodo completo con configuración WiFi
      const nodoCompleto = await getNodeById(nodo.id);
      setNodoEditando(nodoCompleto);
    } catch (error) {
      console.error('Error cargando nodo para editar:', error);
  if (mostrarSnackbar) mostrarSnackbar('Error al cargar nodo para editar', 'error');
    }
  };

  if (cargando) {
    return <div className="cargando">Cargando nodos...</div>;
  }

  return (
    <div className="lista-nodos">
      <h3 style={{display:'flex',alignItems:'center',gap:8}}>
        <span className="fas fa-microchip" style={{color:'#60a5fa'}}></span>
        Listado de Nodos ({nodos.length})
      </h3>
      {error && <div className="config-alert">{error}</div>}
      
      {!nodoEditando && nodos.length === 0 && (
        <div className="sin-nodos" style={{
          background:'var(--surface-section)',
          border:'1px solid rgba(96,165,250,0.15)',
          borderRadius:8,
          padding:'1rem'
        }}>
          <p style={{margin:0}}>No hay nodos configurados en el sistema.</p>
          <p style={{marginTop:6,color:'var(--text-secondary)'}}>Usa la pestaña "Nuevo Nodo" para crear tu primer nodo ESP32/ESP8266.</p>
        </div>
      )}
      
      {!nodoEditando && nodos.length > 0 && (
        <List>
          {nodos.map(nodo => (
            <ListItem key={nodo.id} divider alignItems="flex-start">
              <ListItemText
                primary={<>
                  <strong style={{marginRight:8}}>{nodo.nombre}</strong>
                  <span style={{color:'#94a3b8', marginLeft:6}}>{nodo.tipo} — {nodo.ubicacion}</span>
                </>}
                secondary={
                  <>
                    <div className="nodo-metadata" style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:6}}>
                      {nodo.macAddress && <span>MAC: {nodo.macAddress}</span>}
                      {nodo.ipAddress && <span>IP: {nodo.ipAddress}</span>}
                      {nodo.firmwareVersion && <span>FW: {nodo.firmwareVersion}</span>}
                      {nodo.estado && (
                        <Chip label={nodo.estado} size="small" color={nodo.estado === 'online' ? 'success' : nodo.estado === 'error' ? 'error' : 'default'} />
                      )}
                    </div>
                    {nodo.descripcion && (
                      <p className="nodo-descripcion" style={{margin:'8px 0 0 0'}}>{nodo.descripcion}</p>
                    )}
                    {Array.isArray(nodo.tags) && nodo.tags.length > 0 && (
                      <div className="nodo-tags" style={{marginTop:8}}>
                        {nodo.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" style={{marginRight:6,marginBottom:6}} />
                        ))}
                      </div>
                    )}
                  </>
                }
              />
              <div className="nodo-acciones" style={{display:'flex',gap:8,marginLeft:12,flexWrap:'wrap'}}>
                <Button size="small" variant="outlined" color="error" onClick={() => eliminarNodo(nodo.id)}>Eliminar</Button>
                <Button size="small" variant="contained" onClick={() => editarNodo(nodo)}>Editar</Button>
                <Button size="small" onClick={() => onGestionarDispositivos && onGestionarDispositivos(nodo)}>Gestionar</Button>
                <Button size="small" onClick={() => abrirModalFirmware(nodo)}>📥 Firmware</Button>
                <Button size="small" onClick={() => { if (onFlashearNodo) onFlashearNodo(nodo); else if (mostrarSnackbar) mostrarSnackbar('Función onFlashearNodo no definida','error'); }}>⚡ Flashear</Button>
                <Button size="small" onClick={() => { if (onMonitorSerial) onMonitorSerial(); else if (mostrarSnackbar) mostrarSnackbar('Función onMonitorSerial no definida','error'); }}>📺 Monitor</Button>
              </div>
            </ListItem>
          ))}
        </List>
      )}

      {/* Popup de confirmación para eliminar nodo, centrado en pantalla */}
      {confirmSnackbar.open && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          background: '#23293a',
          color: '#fff',
          minWidth: 380,
          maxWidth: '90vw',
          padding: '2rem 2.5rem',
          borderRadius: 12,
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.35)',
          border: '2.5px solid #3b82f6',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          fontSize: '1.15rem',
        }}>
          <div style={{fontWeight:'bold', fontSize:'1.2rem', marginBottom:4}}>
            ¿Estás seguro de eliminar este nodo?
          </div>
          <div style={{color:'#fbbf24', fontSize:'1rem', marginBottom:8}}>
            Esta acción no se puede deshacer.
          </div>
          <div style={{display:'flex', justifyContent:'center', gap:'1.5rem'}}>
            <Button onClick={cancelarEliminarNodo} color="inherit" variant="outlined">Cancelar</Button>
            <Button onClick={confirmarEliminarNodo} color="error" variant="contained">Eliminar</Button>
          </div>
        </div>
      )}
      {/* Edición en Drawer para evitar problemas de posicionamiento y stacking */}
      <Drawer
        anchor="right"
        open={Boolean(nodoEditando)}
        onClose={() => setNodoEditando(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520, md: 480 } } }}
      >
        <Box sx={{ width: { xs: '100%', sm: 520, md: 480 }, p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="h6">Editar Nodo</Typography>
            <IconButton aria-label="Cerrar editor" onClick={() => setNodoEditando(null)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
            {nodoEditando && (
              <NodoConfig
                nodo={nodoEditando}
                onGuardar={guardarConfigNodo}
                onCancelar={() => setNodoEditando(null)}
              />
            )}
          </Box>
        </Box>
      </Drawer>
      
      {/* Modal de selección de tipo de firmware (MUI Dialog) */}
      <Dialog open={Boolean(modalFirmware)} onClose={() => setModalFirmware(null)} fullWidth maxWidth="sm">
        <DialogTitle>📥 Generar Firmware {modalFirmware ? `para ${modalFirmware.nombre}` : ''}</DialogTitle>
        <DialogContent dividers>
          <div style={{marginBottom: '1rem'}}>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <RadioGroup value={tipoFirmware} onChange={(e) => setTipoFirmware(e.target.value)}>
                <FormControlLabel value="basic" control={<Radio />} label={<div><strong>🔧 Firmware Básico</strong><div style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>Ideal para desarrollo y pruebas. Incluye WiFi, lectura de sensores y comunicación HTTP.</div></div>} />
                <FormControlLabel value="ota" control={<Radio />} label={<div><strong>🚀 Firmware con OTA</strong><div style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>Permite actualizaciones remotas sin cable USB. Incluye ArduinoOTA y actualización HTTP.</div></div>} />
              </RadioGroup>
            </div>
          </div>
          {tipoFirmware === 'ota' && (
            <TextField label="IP del Servidor" fullWidth value={serverIP} onChange={(e) => setServerIP(e.target.value)} placeholder="192.168.1.100" sx={{mt:1}} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalFirmware(null)} variant="outlined">Cancelar</Button>
          <Button onClick={() => descargarFirmware(modalFirmware, tipoFirmware, serverIP)} variant="contained">📥 Descargar Firmware</Button>
        </DialogActions>
      </Dialog>
      
      {/* Formulario de alta de nodo removido. Solo se listan los nodos y sus acciones. */}
    </div>
  );
}

export default ListaNodos;
