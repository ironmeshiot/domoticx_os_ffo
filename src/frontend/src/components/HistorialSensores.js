// Componente para mostrar historial y reportes de sensores
import React from 'react';

function HistorialSensores({ datos }) {
  return (
    <div className="historial-sensores">
      <h3>Historial de Sensores</h3>
      {/* Aquí se mostrarán gráficos y exportación de datos reales */}
      <pre>{JSON.stringify(datos, null, 2)}</pre>
    </div>
  );
}

export default HistorialSensores;
