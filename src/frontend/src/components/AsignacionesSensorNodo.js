// Componente para asignar definiciones de sensores a GPIOs de un nodo específico
import React, { useState, useEffect, useCallback } from 'react';
import {
  getSensorDefinitions,
  getSensorAssignmentsByNode,
  createSensorAssignment,
  updateSensorAssignment,
  deleteSensorAssignment
} from '../services/nodeService';
import '../styles/Biblioteca.css';

function AsignacionesSensorNodo({ nodo }) {
  const [definiciones, setDefiniciones] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [asignacionEditando, setAsignacionEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    definicionId: '',
    pin: '',
    alias: '',
    ubicacionEspecifica: '',
    calibracion: {},
    configuracion: {},
    notas: '',
    activo: true
  });

  const cargarDefiniciones = useCallback(async () => {
    try {
      const data = await getSensorDefinitions();
      setDefiniciones(data);
    } catch (error) {
      console.error('Error cargando definiciones:', error);
    }
  }, []);

  const cargarAsignaciones = useCallback(async () => {
    try {
      const data = await getSensorAssignmentsByNode(nodo.id);
      setAsignaciones(data);
    } catch (error) {
      console.error('Error cargando asignaciones:', error);
    }
  }, [nodo.id]);

  useEffect(() => {
    cargarDefiniciones();
    cargarAsignaciones();
  }, [cargarDefiniciones, cargarAsignaciones]);

  const abrirFormulario = (asignacion = null) => {
    if (asignacion) {
      setAsignacionEditando(asignacion);
      setFormulario({
        definicionId: asignacion.definicionId,
        pin: asignacion.pin,
        alias: asignacion.alias,
        ubicacionEspecifica: asignacion.ubicacionEspecifica || '',
        calibracion: asignacion.calibracion || {},
        configuracion: asignacion.configuracion || {},
        notas: asignacion.notas || '',
        activo: asignacion.activo !== false
      });
    } else {
      setAsignacionEditando(null);
      setFormulario({
        definicionId: '',
        pin: '',
        alias: '',
        ubicacionEspecifica: '',
        calibracion: {},
        configuracion: {},
        notas: '',
        activo: true
      });
    }
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setAsignacionEditando(null);
  };

  const guardarAsignacion = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formulario,
        nodoId: nodo.id
      };

      if (asignacionEditando) {
        await updateSensorAssignment(asignacionEditando.id, payload);
      } else {
        await createSensorAssignment(payload);
      }
      
      await cargarAsignaciones();
      cerrarFormulario();
    } catch (error) {
      console.error('Error guardando asignación:', error);
      alert('Error: ' + error.message);
    }
  };

  const eliminarAsignacion = async (id, alias) => {
    if (!window.confirm(`¿Desinstalar sensor "${alias}"?`)) {
      return;
    }

    try {
      await deleteSensorAssignment(id);
      await cargarAsignaciones();
    } catch (error) {
      console.error('Error eliminando asignación:', error);
      alert('Error: ' + error.message);
    }
  };

  const manejarCambio = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
  };

  const obtenerDefinicion = (definicionId) => {
    return definiciones.find(d => d.id === definicionId);
  };

  const pinesOcupados = asignaciones
    .filter(a => !asignacionEditando || a.id !== asignacionEditando.id)
    .map(a => a.pin);

  return (
    <div className="asignaciones-sensor-nodo">
      <div className="header-asignaciones">
        <h4>🔌 Sensores Instalados en {nodo.nombre}</h4>
        <button className="btn-agregar" onClick={() => abrirFormulario()}>
          ➕ Instalar Sensor
        </button>
      </div>

      {mostrarFormulario && (
        <div className="modal-overlay" onClick={cerrarFormulario}>
          <div className="modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{asignacionEditando ? '✏️ Editar Instalación' : '🔌 Instalar Sensor'}</h3>
              <button className="btn-cerrar" onClick={cerrarFormulario}>✕</button>
            </div>

            <form onSubmit={guardarAsignacion} className="form-asignacion">
              <div className="form-group">
                <label>Sensor (Definición) *</label>
                <select
                  value={formulario.definicionId}
                  onChange={(e) => manejarCambio('definicionId', parseInt(e.target.value))}
                  required
                  disabled={!!asignacionEditando}
                >
                  <option value="">-- Selecciona un sensor --</option>
                  {definiciones.map(def => (
                    <option key={def.id} value={def.id}>
                      {def.nombre} ({def.tipo}) - {def.protocolo}
                    </option>
                  ))}
                </select>
                {formulario.definicionId && (
                  <div className="info-definicion">
                    {(() => {
                      const def = obtenerDefinicion(formulario.definicionId);
                      if (!def) return null;
                      return (
                        <div className="specs">
                          <span>📊 {def.voltajeMin}-{def.voltajeMax}V</span>
                          <span>📍 {def.pinesRequeridos} pin(s) {def.tipoPin}</span>
                          {def.unidad && <span>📏 {def.minValor}-{def.maxValor} {def.unidad}</span>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>GPIO Pin *</label>
                  <input
                    type="number"
                    value={formulario.pin}
                    onChange={(e) => manejarCambio('pin', parseInt(e.target.value))}
                    placeholder="ej: 4, 15, 21"
                    required
                  />
                  {pinesOcupados.includes(formulario.pin) && (
                    <span className="advertencia">⚠️ Pin ya ocupado</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Alias / Nombre Local *</label>
                  <input
                    type="text"
                    value={formulario.alias}
                    onChange={(e) => manejarCambio('alias', e.target.value)}
                    placeholder="ej: Sensor Cocina Principal"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ubicación Específica</label>
                <input
                  type="text"
                  value={formulario.ubicacionEspecifica}
                  onChange={(e) => manejarCambio('ubicacionEspecifica', e.target.value)}
                  placeholder="ej: Pared norte, cerca de ventana"
                />
              </div>

              <div className="form-group">
                <label>Notas de Instalación</label>
                <textarea
                  value={formulario.notas}
                  onChange={(e) => manejarCambio('notas', e.target.value)}
                  placeholder="Detalles de cableado, fecha de instalación, etc."
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancelar" onClick={cerrarFormulario}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {asignacionEditando ? 'Actualizar' : 'Instalar'} Sensor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="lista-asignaciones">
        {asignaciones.length === 0 ? (
          <div className="mensaje-vacio">
            <p>🔌 No hay sensores instalados en este nodo</p>
            <p className="subtexto">Instala sensores de la biblioteca en los GPIOs disponibles</p>
          </div>
        ) : (
          <table className="tabla-asignaciones">
            <thead>
              <tr>
                <th>GPIO</th>
                <th>Sensor</th>
                <th>Alias</th>
                <th>Tipo</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((asig) => {
                const def = obtenerDefinicion(asig.definicionId);
                return (
                  <tr key={asig.id}>
                    <td className="pin-cell">
                      <span className="pin-badge">GPIO {asig.pin}</span>
                    </td>
                    <td>
                      <strong>{asig.definicionNombre || def?.nombre}</strong>
                      {def && <div className="subtexto">{def.protocolo}</div>}
                    </td>
                    <td>{asig.alias}</td>
                    <td>
                      <span className={`badge badge-tipo-${def?.tipo}`}>
                        {def?.tipo}
                      </span>
                    </td>
                    <td className="ubicacion-cell">
                      {asig.ubicacionEspecifica || '-'}
                    </td>
                    <td>
                      <span className={`badge ${asig.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                        {asig.activo ? '✓ Activo' : '✕ Inactivo'}
                      </span>
                    </td>
                    <td className="acciones-cell">
                      <button 
                        className="btn-icon btn-editar-mini" 
                        onClick={() => abrirFormulario(asig)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-eliminar-mini" 
                        onClick={() => eliminarAsignacion(asig.id, asig.alias)}
                        title="Desinstalar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AsignacionesSensorNodo;
