// Componente para monitoreo de sensores en tiempo real
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

function MonitoreoEnVivo() {
  const [socket, setSocket] = useState(null);
  const [estadoSistema, setEstadoSistema] = useState(null);
  const [datosSensores, setDatosSensores] = useState(new Map());
  const [conectado, setConectado] = useState(false);
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    // Conectar a WebSocket
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
      setConectado(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado del servidor WebSocket');
      setConectado(false);
    });

    newSocket.on('estado_sistema', (estado) => {
      setEstadoSistema(estado);
    });

    newSocket.on('dato_sensor', (dato) => {
      setDatosSensores(prev => {
        const nuevos = new Map(prev);
        nuevos.set(dato.sensor_id, dato);
        return nuevos;
      });

      // Verificar alertas
      verificarAlertas(dato);
    });

    newSocket.on('cambio_estado_nodo', (cambio) => {
      if (cambio.estado_nuevo === 'offline') {
        agregarAlerta('warning', `Nodo ${cambio.nombre} se desconectó`);
      }
    });

    return () => newSocket.close();
  }, []);

  const verificarAlertas = (dato) => {
    // Alertas básicas de ejemplo
    if (dato.sensor_id === 1 && dato.valor > 30) { // Temperatura alta
      agregarAlerta('error', `Temperatura alta: ${dato.valor.toFixed(1)}°C`);
    }
    if (dato.sensor_id === 2 && dato.valor > 80) { // Humedad alta
      agregarAlerta('warning', `Humedad alta: ${dato.valor.toFixed(1)}%`);
    }
  };

  const agregarAlerta = (tipo, mensaje) => {
    const nuevaAlerta = {
      id: Date.now(),
      tipo,
      mensaje,
      timestamp: new Date().toLocaleTimeString()
    };
    setAlertas(prev => [nuevaAlerta, ...prev.slice(0, 9)]); // Máximo 10 alertas
  };

  const suscribirSensor = (sensorId) => {
    if (socket) {
      socket.emit('suscribir_sensor', sensorId);
    }
  };

  const desuscribirSensor = (sensorId) => {
    if (socket) {
      socket.emit('desuscribir_sensor', sensorId);
    }
  };

  return (
    <div className="monitoreo-en-vivo">
      <h2>Monitoreo en Tiempo Real</h2>
      
      {/* Estado de conexión */}
      <div className={`estado-conexion ${conectado ? 'conectado' : 'desconectado'}`}>
        {conectado ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>

      {/* Estado del sistema */}
      {estadoSistema && (
        <div className="estado-sistema">
          <h3>Estado General</h3>
          <div className="metricas">
            <div className="metrica">
              <span className="valor">{estadoSistema.estadoGeneral.total_nodos}</span>
              <span className="label">Nodos Total</span>
            </div>
            <div className="metrica">
              <span className="valor">{estadoSistema.estadoGeneral.nodos_online}</span>
              <span className="label">Online</span>
            </div>
            <div className="metrica">
              <span className="valor">{estadoSistema.estadoGeneral.porcentaje_disponibilidad}%</span>
              <span className="label">Disponibilidad</span>
            </div>
          </div>
        </div>
      )}

      {/* Datos de sensores en vivo */}
      <div className="sensores-vivo">
        <h3>Sensores en Vivo</h3>
        <div className="controles">
          <button onClick={() => suscribirSensor(1)}>Suscribir Temperatura</button>
          <button onClick={() => suscribirSensor(2)}>Suscribir Humedad</button>
          <button onClick={() => desuscribirSensor(1)}>Desuscribir Temperatura</button>
          <button onClick={() => desuscribirSensor(2)}>Desuscribir Humedad</button>
        </div>
        
        <div className="datos-sensores">
          {Array.from(datosSensores.entries()).map(([sensorId, dato]) => (
            <div key={sensorId} className="dato-sensor">
              <h4>Sensor {sensorId}</h4>
              <div className="valor-grande">{dato.valor.toFixed(2)}</div>
              <div className="timestamp">{new Date(dato.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="alertas">
          <h3>Alertas Recientes</h3>
          {alertas.map(alerta => (
            <div key={alerta.id} className={`alerta ${alerta.tipo}`}>
              <span className="mensaje">{alerta.mensaje}</span>
              <span className="tiempo">{alerta.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MonitoreoEnVivo;