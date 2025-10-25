// Widget para mostrar información de un nodo
import React from 'react';

function NodoWidget({ nombreNodo, estado, ubicacion }) {
  return (
    <div className="nodo-widget">
      <h3>{nombreNodo}</h3>
      <p>Estado: {estado}</p>
      <p>Ubicación: {ubicacion}</p>
      {/* Aquí se agregarán sensores, actuadores y controles */}
    </div>
  );
}

export default NodoWidget;
