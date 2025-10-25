// Componente raíz de la aplicación DomoticX OS FFO
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';
import DashboardPage from './pages/DashboardPage';
import AdminNodosPage from './pages/AdminNodosPage';
import ConfigPage from './pages/ConfigPage';
import UsuariosPage from './pages/UsuariosPage';
import DashboardConfigPage from './pages/DashboardConfigPage';

// Barra superior compacta con hora y estado
function DashboardTopBar() {
  const [now, setNow] = useState(new Date());
  const [apiOnline, setApiOnline] = useState(null);
  const [wsOnline, setWsOnline] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let apiTimer = null;
    const pingApi = async () => {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        setApiOnline(res.ok);
      } catch (_) {
        setApiOnline(false);
      }
    };
    pingApi();
    apiTimer = setInterval(pingApi, 10000);

    const wsUrl = `${window.location.protocol}//${window.location.hostname}:4000`;
    const socket = io(wsUrl, { transports: ['websocket'], autoConnect: true });
    socket.on('connect', () => setWsOnline(true));
    socket.on('disconnect', () => setWsOnline(false));

    return () => {
      if (apiTimer) clearInterval(apiTimer);
      try { socket.close(); } catch {}
    };
  }, []);

  return (
    <div className="dashboard-topbar">
      <div className="topbar-left">
        <i className="fas fa-clock"></i>
        <span className="topbar-time">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        <span className="topbar-date">{now.toLocaleDateString()}</span>
      </div>
      <div className="topbar-right">
        <div className="topbar-pill" title="API Backend">
          <i className={`fas fa-server ${apiOnline ? 'ok' : 'err'}`}></i>
          <span>{apiOnline === null ? 'API' : apiOnline ? 'API OK' : 'API OFF'}</span>
        </div>
        <div className="topbar-pill" title="WebSocket">
          <i className={`fas fa-bolt ${wsOnline ? 'ok' : 'err'}`}></i>
          <span>{wsOnline === null ? 'WS' : wsOnline ? 'WS OK' : 'WS OFF'}</span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [pagina, setPagina] = useState('dashboard');

  let contenido;
  switch (pagina) {
    case 'dashboard':
      contenido = <DashboardPage />;
      break;
    case 'nodos':
      contenido = <AdminNodosPage />;
      break;
    case 'config':
      contenido = <ConfigPage />;
      break;
    case 'usuarios':
      contenido = <UsuariosPage />;
      break;
    case 'dashboardConfig':
      contenido = <DashboardConfigPage />;
      break;
    default:
      contenido = <DashboardPage />;
  }

  return (
    <div className="app-root">
      <header>
        <div className="header-brand">
          <img src="/logo_domoticx.svg" alt="DomoticX" className="header-logo" />
        </div>
        <nav>
          <button onClick={() => setPagina('dashboard')}>Dashboard</button>
          <button onClick={() => setPagina('dashboardConfig')}>Configurar Widgets</button>
          <button onClick={() => setPagina('nodos')}>Administrar Nodos</button>
          <button onClick={() => setPagina('usuarios')}>Usuarios</button>
          <button onClick={() => setPagina('config')}>Configuración</button>
        </nav>
      </header>
      {pagina === 'dashboard' && <DashboardTopBar />}
      <main>
        {contenido}
      </main>
    </div>
  );
}

export default App;
