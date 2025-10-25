// Panel de monitoreo en tiempo real
import React from 'react';

function PanelMonitoreo({ estadoSistema, eventos }) {
  return (
    <div className="panel-monitoreo">
      <h3>Monitoreo en Tiempo Real</h3>
      <p>Estado del sistema: {estadoSistema}</p>
      <ul>
        {eventos.map((ev, idx) => (
          <li key={idx}>{ev}</li>
        ))}
      </ul>
    </div>
  );
}

export default PanelMonitoreo;
