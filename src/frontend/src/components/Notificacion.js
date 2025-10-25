// Componente para mostrar notificaciones
import React from 'react';

function Notificacion({ mensaje, tipo }) {
  return (
    <div className={`notificacion notificacion-${tipo}`}>
      {mensaje}
    </div>
  );
}

export default Notificacion;
