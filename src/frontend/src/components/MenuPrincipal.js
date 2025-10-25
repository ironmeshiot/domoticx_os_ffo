// Menú principal de navegación
import React from 'react';

function MenuPrincipal({ onNavigate }) {
  return (
    <nav className="menu-principal">
      <ul>
        <li><button onClick={() => onNavigate('dashboard')}>Dashboard</button></li>
        <li><button onClick={() => onNavigate('nodos')}>Nodos</button></li>
        <li><button onClick={() => onNavigate('config')}>Configuración</button></li>
        <li><button onClick={() => onNavigate('usuarios')}>Usuarios</button></li>
      </ul>
    </nav>
  );
}

export default MenuPrincipal;
