// Componente para gestionar dispositivos (sensores/actuadores) de un nodo específico
import React, { useState } from 'react';
import { Tabs, Tab, Box, Button, Typography } from '@mui/material';
import GPIOManager from './GPIOManager';
import AsignacionesSensorNodo from './AsignacionesSensorNodo';
import AsignacionesActuadorNodo from './AsignacionesActuadorNodo';

function GestionDispositivosNodo({ nodo, onVolver }) {
  const [tabActual, setTabActual] = useState(0);

  if (!nodo) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No hay nodo seleccionado</p>
        <Button onClick={onVolver}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="gestion-dispositivos-nodo">
      {/* Header con botón volver */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button 
          variant="outlined" 
          onClick={onVolver}
          sx={{ 
            color: '#94a3b8',
            borderColor: '#394150',
            '&:hover': { borderColor: '#60a5fa', color: '#60a5fa' }
          }}
        >
          ← Volver a Nodos
        </Button>
        <Typography variant="h5" sx={{ color: '#e6e6e6', flex: 1 }}>
          Dispositivos del Nodo: <strong>{nodo.nombre}</strong>
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          fontSize: '0.875rem',
          color: '#94a3b8'
        }}>
          <span>📍 {nodo.ubicacion}</span>
          <span>•</span>
          <span>🌐 {nodo.ipAddress || 'Sin IP'}</span>
          <span>•</span>
          <span className={`nodo-estado ${nodo.estado}`}>
            {nodo.estado === 'online' ? '🟢 Online' : '⚫ Offline'}
          </span>
        </Box>
      </Box>

      {/* Tabs: GPIOs | Sensores | Actuadores */}
      <Tabs 
        value={tabActual} 
        onChange={(_, v) => setTabActual(v)}
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: '#60a5fa', height: 2 } }}
        sx={{
          borderBottom: 1,
          borderColor: '#394150',
          mb: 3,
          '& .MuiTab-root': {
            color: '#94a3b8',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            minHeight: 48,
            backgroundColor: 'transparent',
            '&:hover': {
              color: '#cbd5e1'
            },
            '&.Mui-selected': {
              color: '#60a5fa',
              backgroundColor: 'transparent'
            }
          }
        }}
      >
        <Tab label="📌 Mapa de GPIOs" />
        <Tab label="📡 Sensores" />
        <Tab label="⚡ Actuadores" />
      </Tabs>

      {/* Contenido de tabs */}
      <Box sx={{ mt: 2 }}>
        {tabActual === 0 && (
          <GPIOManager
            nodoId={nodo.id}
            gpioSensores={nodo.gpioSensores}
            gpioActuadores={nodo.gpioActuadores}
            gpioLibres={nodo.gpioLibres}
            tipoNodo={nodo.tipo}
            onChange={(field, value) => {
              // Solo visualización, los cambios se hacen desde editar nodo
              console.log('GPIO change:', field, value);
            }}
          />
        )}

        {tabActual === 1 && (
          <AsignacionesSensorNodo nodo={nodo} />
        )}

        {tabActual === 2 && (
          <AsignacionesActuadorNodo nodo={nodo} />
        )}
      </Box>
    </div>
  );
}

export default GestionDispositivosNodo;
