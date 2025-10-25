// Componente para motor de automatizaciones y reglas
import React from 'react';

function Automatizaciones({ reglas }) {
  return (
    <div className="automatizaciones">
      <h3>Automatizaciones y Reglas</h3>
      <ul>
        {reglas.map((regla, idx) => (
          <li key={idx}>{regla.descripcion}</li>
        ))}
      </ul>
      {/* Editor visual de reglas a implementar */}
    </div>
  );
}

export default Automatizaciones;
