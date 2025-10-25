// Componente para gestión completa de actuadores
import React, { useState, useEffect, useCallback } from 'react';
import {
  getActuatorsByNode,
  createActuator,
  updateActuator,
  deleteActuator,
  getNodes
} from '../services/nodeService';

const TIPOS_ACTUADORES = [
  { 
    valor: 'relay', 
    nombre: 'Relé/Switch', 
    pines: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
    comandos: ['ON', 'OFF', 'TOGGLE']
  },
  { 
    valor: 'dimmer', 
    nombre: 'Dimmer/PWM', 
    pines: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'],
    comandos: ['SET_LEVEL'] // 0-100%
  },
  { 
    valor: 'servo', 
    nombre: 'Servo Motor', 
    pines: ['D1', 'D2', 'D3', 'D4'],
    comandos: ['SET_ANGLE'] // 0-180°
  },
  { 
    valor: 'motor', 
    nombre: 'Motor DC', 
    pines: ['D1/D2', 'D3/D4'],
    comandos: ['FORWARD', 'BACKWARD', 'STOP', 'SET_SPEED']
  },
  { 
    valor: 'rgb_led', 
    nombre: 'LED RGB', 
    pines: ['D1/D2/D3', 'D4/D5/D6'],
    comandos: ['SET_COLOR', 'SET_BRIGHTNESS', 'OFF']
  },
  { 
    valor: 'buzzer', 
    nombre: 'Buzzer/Alarma', 
    pines: ['D1', 'D2', 'D3', 'D4'],
    comandos: ['BEEP', 'TONE', 'OFF']
  },
  { 
    valor: 'valve', 
    nombre: 'Válvula/Solenoide', 
    pines: ['D1', 'D2', 'D3', 'D4'],
    comandos: ['OPEN', 'CLOSE']
  }
];

function GestionActuadores({ nodoId, nodoNombre, onActualizar }) {
  const [actuadores, setActuadores] = useState([]);
  const [nodos, setNodos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [actuadorEditando, setActuadorEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nodoId: nodoId || '',
    nombre: '',
    tipo: 'relay',
    pin: '',
    activo: true,
    configuracion: {
      voltaje: 5, // V
      corrienteMax: 1, // A
      inversionLogica: false,
      tiempoActivacion: 0, // ms para pulsos
      autoOff: false,
      tiempoAutoOff: 0 // ms
    }
  });

  const cargarNodos = useCallback(async () => {
    try {
      const data = await getNodes();
      setNodos(data);
    } catch (error) {
      console.error('Error cargando nodos:', error);
    }
  }, []);

  const cargarActuadores = useCallback(async () => {
    try {
      const data = await getActuatorsByNode(nodoId);
      const normalizados = data.map((actuador) => {
        const configuracionOriginal = typeof actuador.configuracion === 'string'
          ? JSON.parse(actuador.configuracion)
          : actuador.configuracion || {};

        return {
          ...actuador,
          configuracion: {
            voltaje: configuracionOriginal.voltaje ?? 5,
            corrienteMax: configuracionOriginal.corrienteMax ?? configuracionOriginal.corriente_max ?? 1,
            inversionLogica: configuracionOriginal.inversionLogica ?? configuracionOriginal.inversion_logica ?? false,
            tiempoActivacion: configuracionOriginal.tiempoActivacion ?? configuracionOriginal.tiempo_activacion ?? 0,
            autoOff: configuracionOriginal.autoOff ?? configuracionOriginal.auto_off ?? false,
            tiempoAutoOff: configuracionOriginal.tiempoAutoOff ?? configuracionOriginal.tiempo_auto_off ?? 0
          },
          estado: actuador.estado || { tipo: 'binario', valor: false }
        };
      });
      setActuadores(normalizados);
    } catch (error) {
      console.error('Error cargando actuadores:', error);
    }
  }, [nodoId]);

  useEffect(() => {
    cargarNodos();
    cargarActuadores();
  }, [nodoId, cargarActuadores, cargarNodos]);

  const manejarCambioTipo = (tipo) => {
    setFormulario(prev => ({
      ...prev,
      tipo,
      pin: '',
      configuracion: {
        ...prev.configuracion,
        voltaje: tipo === 'servo' ? 5 : 
                 tipo === 'motor' ? 12 : 
                 tipo === 'valve' ? 24 : 5,
        corrienteMax: tipo === 'motor' ? 2 :
                       tipo === 'valve' ? 0.5 : 1
      }
    }));
  };

  const guardarActuador = async (e) => {
    e.preventDefault();
    
    // Validar que se seleccionó un nodo si no hay nodoId del prop
    const nodoIdFinal = nodoId || formulario.nodoId;
    if (!nodoIdFinal) {
      alert('Debes seleccionar un nodo');
      return;
    }
    
    try {
      if (actuadorEditando) {
        await updateActuator(actuadorEditando.id, {
          nombre: formulario.nombre,
          tipo: formulario.tipo,
          pin: formulario.pin,
          activo: formulario.activo,
          configuracion: formulario.configuracion
        });
      } else {
        await createActuator(nodoIdFinal, formulario);
      }

      await cargarActuadores();
      cerrarFormulario();
      if (onActualizar) onActualizar();
      alert(actuadorEditando ? 'Actuador actualizado!' : 'Actuador agregado!');
    } catch (error) {
      console.error('Error guardando actuador:', error);
      alert('Error al guardar actuador');
    }
  };

  const editarActuador = (actuador) => {
    setActuadorEditando(actuador);
    setFormulario({
      nombre: actuador.nombre,
      tipo: actuador.tipo,
      pin: actuador.pin,
      activo: actuador.activo,
      configuracion: actuador.configuracion || {
        voltaje: 5,
        corrienteMax: 1,
        inversionLogica: false,
        tiempoActivacion: 0,
        autoOff: false,
        tiempoAutoOff: 0
      }
    });
    setMostrarFormulario(true);
  };

  const eliminarActuador = async (actuadorId) => {
    if (window.confirm('¿Estás seguro de eliminar este actuador?')) {
      try {
        await deleteActuator(actuadorId);
        await cargarActuadores();
        if (onActualizar) onActualizar();
      } catch (error) {
        console.error('Error eliminando actuador:', error);
      }
    }
  };

  const probarActuador = async (actuador, comando, valor = null) => {
    try {
      const estadoActual = actuador.estado || { tipo: 'binario', valor: false };
      let nuevoEstado = { ...estadoActual };

      if (actuador.tipo === 'relay') {
        if (comando === 'ON') nuevoEstado = { tipo: 'binario', valor: true };
        if (comando === 'OFF') nuevoEstado = { tipo: 'binario', valor: false };
        if (comando === 'TOGGLE') nuevoEstado = { tipo: 'binario', valor: !estadoActual.valor };
      }

      if (actuador.tipo === 'dimmer') {
        const nivel = valor !== null ? Number(valor) : 0;
        nuevoEstado = { tipo: 'porcentaje', valor: nivel };
      }

      if (actuador.tipo === 'servo') {
        const angulo = valor !== null ? Number(valor) : 0;
        nuevoEstado = { tipo: 'angulo', valor: angulo };
      }

      if (actuador.tipo === 'rgb_led' && comando === 'SET_COLOR') {
        nuevoEstado = { tipo: 'color', valor: valor || '#ffffff' };
      }

      await updateActuator(actuador.id, {
        ...actuador,
        estado: nuevoEstado,
        estado_actual: nuevoEstado,
        activo: nuevoEstado.tipo === 'binario' ? Boolean(nuevoEstado.valor) : true
      });
      await cargarActuadores();
    } catch (error) {
      console.error('Error simulando actuador:', error);
      alert('No se pudo simular el comando del actuador');
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setActuadorEditando(null);
    setFormulario({
      nodoId: nodoId || '',
      nombre: '',
      tipo: 'relay',
      pin: '',
      activo: true,
      configuracion: {
        voltaje: 5,
        corrienteMax: 1,
        inversionLogica: false,
        tiempoActivacion: 0,
        autoOff: false,
        tiempoAutoOff: 0
      }
    });
  };

  const tipoActual = TIPOS_ACTUADORES.find(t => t.valor === formulario.tipo);

  return (
    <div className="gestion-actuadores">
      <div className="header-actuadores">
        <h3>Actuadores {nodoId ? `del Nodo: ${nodoNombre}` : 'del Sistema'}</h3>
        <button 
          className="btn-agregar"
          onClick={() => setMostrarFormulario(true)}
        >
          + Agregar Actuador
        </button>
      </div>

      {!nodoId && (
        <div style={{
          background: 'rgba(96, 165, 250, 0.1)',
          border: '1px solid rgba(96, 165, 250, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#cbd5e1'
        }}>
          <strong>💡 Tip:</strong> También puedes agregar actuadores desde "Nodos" → "Gestionar Dispositivos" para ver el mapa de GPIOs del nodo.
        </div>
      )}

      {/* Lista de actuadores existentes */}
      <div className="lista-actuadores">
        {actuadores.length === 0 ? (
          <p className="sin-actuadores">No hay actuadores configurados {nodoId ? 'en este nodo' : 'en el sistema'}.</p>
        ) : (
          actuadores.map(actuadorItem => (
            <div key={actuadorItem.id} className="actuador-item">
              <div className="actuador-info">
                <h4>{actuadorItem.nombre}</h4>
                {!nodoId && actuadorItem.nodoNombre && (
                  <span className="badge-nodo">📡 {actuadorItem.nodoNombre}</span>
                )}
                <div className="actuador-detalles">
                  <span className="tipo">{actuadorItem.tipo}</span>
                  <span className="pin">Pin: {actuadorItem.pin}</span>
                  <span className={`estado ${actuadorItem.activo ? 'activo' : 'inactivo'}`}>
                    {actuadorItem.activo ? 'Activo' : 'Inactivo'}
                  </span>
                    {actuadorItem.estado && (
                      <span className="estado-valor">
                        {actuadorItem.estado.tipo === 'binario' && (actuadorItem.estado.valor ? 'ON' : 'OFF')}
                        {actuadorItem.estado.tipo === 'porcentaje' && `${actuadorItem.estado.valor}%`}
                        {actuadorItem.estado.tipo === 'angulo' && `${actuadorItem.estado.valor}°`}
                        {actuadorItem.estado.tipo === 'color' && actuadorItem.estado.valor}
                      </span>
                    )}
                </div>
              </div>
              
              <div className="actuador-controles">
                {/* Controles rápidos según tipo */}
                {actuadorItem.tipo === 'relay' && (
                  <>
                    <button onClick={() => probarActuador(actuadorItem, 'ON')} className="btn-on">
                      ON
                    </button>
                    <button onClick={() => probarActuador(actuadorItem, 'OFF')} className="btn-off">
                      OFF
                    </button>
                  </>
                )}
                
                {actuadorItem.tipo === 'dimmer' && (
                  <div className="dimmer-control">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={actuadorItem.estado?.tipo === 'porcentaje' ? actuadorItem.estado.valor : 0}
                      onChange={(e) => probarActuador(actuadorItem, 'SET_LEVEL', e.target.value)}
                    />
                  </div>
                )}
                
                {actuadorItem.tipo === 'servo' && (
                  <div className="servo-control">
                    <input 
                      type="range" 
                      min="0" 
                      max="180" 
                      value={actuadorItem.estado?.tipo === 'angulo' ? actuadorItem.estado.valor : 0}
                      onChange={(e) => probarActuador(actuadorItem, 'SET_ANGLE', e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="actuador-acciones">
                <button onClick={() => editarActuador(actuadorItem)}>Editar</button>
                <button onClick={() => eliminarActuador(actuadorItem.id)} className="btn-eliminar">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario para agregar/editar actuador */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-actuador">
            <h3>{actuadorEditando ? 'Editar Actuador' : 'Agregar Nuevo Actuador'}</h3>
            
            <form onSubmit={guardarActuador}>
              {!nodoId && (
                <div className="form-group">
                  <label>Nodo:</label>
                  <select
                    value={formulario.nodoId}
                    onChange={(e) => setFormulario(prev => ({...prev, nodoId: e.target.value}))}
                    required
                  >
                    <option value="">Seleccionar nodo...</option>
                    {nodos.map(nodo => (
                      <option key={nodo.id} value={nodo.id}>
                        {nodo.nombre} - {nodo.ubicacion}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Nombre del Actuador:</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario(prev => ({...prev, nombre: e.target.value}))}
                  required
                  placeholder="Ej: Luz Living, Motor Ventana"
                />
              </div>

              <div className="form-group">
                <label>Tipo de Actuador:</label>
                <select
                  value={formulario.tipo}
                  onChange={(e) => manejarCambioTipo(e.target.value)}
                >
                  {TIPOS_ACTUADORES.map(tipo => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Pin de Conexión:</label>
                <select
                  value={formulario.pin}
                  onChange={(e) => setFormulario(prev => ({...prev, pin: e.target.value}))}
                  required
                >
                  <option value="">Seleccionar pin...</option>
                  {tipoActual?.pines.map(pin => (
                    <option key={pin} value={pin}>{pin}</option>
                  ))}
                </select>
              </div>

              {/* Configuración avanzada */}
              <details className="config-avanzada">
                <summary>Configuración Avanzada</summary>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Voltaje (V):</label>
                    <input
                      type="number"
                      value={formulario.configuracion.voltaje}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          voltaje: parseFloat(e.target.value)
                        }
                      }))}
                      min="3.3"
                      max="24"
                      step="0.1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Corriente Máx (A):</label>
                    <input
                      type="number"
                      value={formulario.configuracion.corrienteMax}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          corrienteMax: parseFloat(e.target.value)
                        }
                      }))}
                      min="0.1"
                      max="10"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formulario.configuracion.inversionLogica}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          inversionLogica: e.target.checked
                        }
                      }))}
                    />
                    Inversión lógica (LOW = ON)
                  </label>
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formulario.configuracion.autoOff}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          autoOff: e.target.checked
                        }
                      }))}
                    />
                    Auto-apagado
                  </label>
                  {formulario.configuracion.autoOff && (
                    <input
                      type="number"
                      placeholder="Tiempo en ms"
                      value={formulario.configuracion.tiempoAutoOff}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          tiempoAutoOff: parseInt(e.target.value)
                        }
                      }))}
                    />
                  )}
                </div>
              </details>

              <div className="form-acciones">
                <button type="submit" className="btn-guardar">
                  {actuadorEditando ? 'Actualizar' : 'Agregar'} Actuador
                </button>
                <button type="button" onClick={cerrarFormulario} className="btn-cancelar">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionActuadores;