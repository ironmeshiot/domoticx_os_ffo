// Página para configurar el dashboard y sus widgets
import React, { useState, useEffect } from 'react';
import PanelWidgets from '../components/PanelWidgets';
import { guardarConfigWidgets, cargarConfigWidgets } from '../services/widgetsService';

// Simulación de nodos, sensores y actuadores
const nodosDemo = [
  { id: 1, nombre: 'Cocina', tipo: 'ESP32', ubicacion: 'Cocina' },
  { id: 2, nombre: 'Living', tipo: 'ESP8266', ubicacion: 'Living' },
];
const sensoresDemo = [
  { id: 1, nombre: 'Temperatura', tipo: 'DHT22', nodo: 1 },
  { id: 2, nombre: 'Humedad', tipo: 'DHT22', nodo: 1 },
  { id: 3, nombre: 'Movimiento', tipo: 'PIR', nodo: 2 },
];
const actuadoresDemo = [
  { id: 1, nombre: 'Luz Cocina', tipo: 'Relay', nodo: 1 },
  { id: 2, nombre: 'Ventilador Living', tipo: 'Relay', nodo: 2 },
];

function DashboardConfigPage() {
  const [configWidgets, setConfigWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarConfigWidgets()
      .then(data => {
        setConfigWidgets(Array.isArray(data?.widgets) ? data.widgets : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando configuración de widgets:', err);
        setConfigWidgets([]);
        setError('No se pudo cargar la configuración guardada. Se muestran los datos de ejemplo.');
        setLoading(false);
      });
  }, []);

  const guardarConfig = async (widgets) => {
    setLoading(true);
    try {
      await guardarConfigWidgets(widgets);
      setConfigWidgets(widgets);
      alert('¡Configuración guardada!');
    } catch {
      setError('Error al guardar configuración');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="dashboard-config-page">
        <h2>Configuración del Dashboard</h2>
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-config-page">
      <h2>Configuración del Dashboard</h2>
      {error && (
        <div className="config-alert">
          {error}
        </div>
      )}
      <PanelWidgets
        nodos={nodosDemo}
        sensores={sensoresDemo}
        actuadores={actuadoresDemo}
        configInicial={configWidgets}
        onGuardar={guardarConfig}
      />
    </div>
  );
}

export default DashboardConfigPage;
