// Componente para gestión completa de sensores
import React, { useState, useEffect, useCallback } from 'react';
import {
  getSensorsByNode,
  createSensor,
  updateSensor,
  deleteSensor,
  getNodes
} from '../services/nodeService';

const TIPOS_SENSORES = [
  { valor: 'temperatura', nombre: 'Temperatura', unidad: '°C', pines: ['A0', 'A1', 'D4', 'D5'] },
  { valor: 'humedad', nombre: 'Humedad', unidad: '%', pines: ['A0', 'A1', 'D4', 'D5'] },
  { valor: 'luz', nombre: 'Luz/LDR', unidad: 'lux', pines: ['A0', 'A1', 'A2'] },
  { valor: 'movimiento', nombre: 'PIR/Movimiento', unidad: 'bool', pines: ['D1', 'D2', 'D3', 'D4'] },
  { valor: 'gas', nombre: 'Gas/Humo', unidad: 'ppm', pines: ['A0', 'A1'] },
  { valor: 'presion', nombre: 'Presión', unidad: 'hPa', pines: ['SDA', 'SCL'] },
  { valor: 'distancia', nombre: 'Ultrasonido', unidad: 'cm', pines: ['D1/D2', 'D3/D4'] },
  { valor: 'corriente', nombre: 'Corriente AC', unidad: 'A', pines: ['A0'] },
  { valor: 'voltaje', nombre: 'Voltaje', unidad: 'V', pines: ['A0', 'A1'] },
  { valor: 'ph', nombre: 'pH', unidad: 'pH', pines: ['A0'] },
  { valor: 'co2', nombre: 'CO2', unidad: 'ppm', pines: ['A0', 'SDA/SCL'] },
  { valor: 'sonido', nombre: 'Micrófono', unidad: 'dB', pines: ['A0', 'A1'] }
];

function GestionSensores({ nodoId, nodoNombre, onActualizar }) {
  const [sensores, setSensores] = useState([]);
  const [nodos, setNodos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [sensorEditando, setSensorEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nodoId: nodoId || '',
    nombre: '',
    tipo: 'temperatura',
    pin: '',
    unidad: '°C',
    minValor: 0,
    maxValor: 100,
    activo: true,
    calibracion: {
      offset: 0,
      multiplicador: 1,
      ecuacion: 'lineal'
    },
    configuracion: {
      frecuenciaLectura: 5000, // ms
      filtroRuido: true,
      promedioMuestras: 3
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

  const cargarSensores = useCallback(async () => {
    try {
      const data = await getSensorsByNode(nodoId);
      const normalizados = data.map((sensor) => {
        const configOriginal = typeof sensor.configuracion === 'string'
          ? JSON.parse(sensor.configuracion)
          : sensor.configuracion || {};

        const calibracionOriginal = typeof sensor.calibracion === 'string'
          ? JSON.parse(sensor.calibracion)
          : sensor.calibracion || {};

        return {
          ...sensor,
          minValor: sensor.minValor ?? sensor.min_valor ?? 0,
          maxValor: sensor.maxValor ?? sensor.max_valor ?? 100,
          configuracion: {
            frecuenciaLectura: configOriginal.frecuenciaLectura ?? configOriginal.frecuencia_lectura ?? 5000,
            filtroRuido: configOriginal.filtroRuido ?? configOriginal.filtro_ruido ?? true,
            promedioMuestras: configOriginal.promedioMuestras ?? configOriginal.promedio_muestras ?? 3
          },
          calibracion: {
            offset: calibracionOriginal.offset ?? 0,
            multiplicador: calibracionOriginal.multiplicador ?? 1,
            ecuacion: calibracionOriginal.ecuacion || 'lineal'
          }
        };
      });
      setSensores(normalizados);
    } catch (error) {
      console.error('Error cargando sensores:', error);
    }
  }, [nodoId]);

  useEffect(() => {
    cargarNodos();
    cargarSensores();
  }, [nodoId, cargarSensores, cargarNodos]);

  const manejarCambioTipo = (tipo) => {
    const tipoInfo = TIPOS_SENSORES.find(t => t.valor === tipo);
    setFormulario(prev => ({
      ...prev,
      tipo,
      unidad: tipoInfo.unidad,
      pin: '',
      minValor: tipo === 'temperatura' ? -40 : 0,
      maxValor: tipo === 'temperatura' ? 85 : 
                 tipo === 'humedad' ? 100 :
                 tipo === 'luz' ? 1000 :
                 tipo === 'distancia' ? 400 : 1024
    }));
  };

  const guardarSensor = async (e) => {
    e.preventDefault();
    
    // Validar que se seleccionó un nodo si no hay nodoId del prop
    const nodoIdFinal = nodoId || formulario.nodoId;
    if (!nodoIdFinal) {
      alert('Debes seleccionar un nodo');
      return;
    }
    
    try {
      if (sensorEditando) {
        await updateSensor(sensorEditando.id, {
          nombre: formulario.nombre,
          tipo: formulario.tipo,
          pin: formulario.pin,
          unidad: formulario.unidad,
          minValor: formulario.minValor,
          maxValor: formulario.maxValor,
          activo: formulario.activo,
          configuracion: formulario.configuracion,
          calibracion: formulario.calibracion
        });
      } else {
        await createSensor(nodoIdFinal, formulario);
      }

      await cargarSensores();
      cerrarFormulario();
      if (onActualizar) onActualizar();
      alert(sensorEditando ? 'Sensor actualizado!' : 'Sensor agregado!');
    } catch (error) {
      console.error('Error guardando sensor:', error);
      alert('Error al guardar sensor');
    }
  };

  const editarSensor = (sensor) => {
    setSensorEditando(sensor);
    setFormulario({
      nombre: sensor.nombre,
      tipo: sensor.tipo,
      pin: sensor.pin,
      unidad: sensor.unidad,
      minValor: sensor.minValor,
      maxValor: sensor.maxValor,
      activo: sensor.activo,
      calibracion: sensor.calibracion || {
        offset: 0,
        multiplicador: 1,
        ecuacion: 'lineal'
      },
      configuracion: sensor.configuracion || {
        frecuenciaLectura: 5000,
        filtroRuido: true,
        promedioMuestras: 3
      }
    });
    setMostrarFormulario(true);
  };

  const eliminarSensor = async (sensorId) => {
    if (window.confirm('¿Estás seguro de eliminar este sensor?')) {
      try {
        await deleteSensor(sensorId);
        await cargarSensores();
        if (onActualizar) onActualizar();
      } catch (error) {
        console.error('Error eliminando sensor:', error);
      }
    }
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setSensorEditando(null);
    setFormulario({
      nodoId: nodoId || '',
      nombre: '',
      tipo: 'temperatura',
      pin: '',
      unidad: '°C',
      minValor: 0,
      maxValor: 100,
      activo: true,
      calibracion: { offset: 0, multiplicador: 1, ecuacion: 'lineal' },
      configuracion: { frecuenciaLectura: 5000, filtroRuido: true, promedioMuestras: 3 }
    });
  };

  const tipoActual = TIPOS_SENSORES.find(t => t.valor === formulario.tipo);

  return (
    <div className="gestion-sensores">
      <div className="header-sensores">
        <h3>Sensores {nodoId ? `del Nodo: ${nodoNombre}` : 'del Sistema'}</h3>
        <button 
          className="btn-agregar"
          onClick={() => setMostrarFormulario(true)}
        >
          + Agregar Sensor
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
          <strong>💡 Tip:</strong> También puedes agregar sensores desde "Nodos" → "Gestionar Dispositivos" para ver el mapa de GPIOs del nodo.
        </div>
      )}

      {/* Lista de sensores existentes */}
      <div className="lista-sensores">
        {sensores.length === 0 ? (
          <p className="sin-sensores">No hay sensores configurados {nodoId ? 'en este nodo' : 'en el sistema'}.</p>
        ) : (
          sensores.map(sensor => (
            <div key={sensor.id} className="sensor-item">
              <div className="sensor-info">
                <h4>{sensor.nombre}</h4>
                {!nodoId && sensor.nodoNombre && (
                  <span className="badge-nodo">📡 {sensor.nodoNombre}</span>
                )}
                <div className="sensor-detalles">
                  <span className="tipo">{sensor.tipo}</span>
                  <span className="pin">Pin: {sensor.pin}</span>
                  <span className="rango">{sensor.minValor} - {sensor.maxValor} {sensor.unidad}</span>
                  <span className={`estado ${sensor.activo ? 'activo' : 'inactivo'}`}>
                    {sensor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
              <div className="sensor-acciones">
                <button onClick={() => editarSensor(sensor)}>Editar</button>
                <button onClick={() => eliminarSensor(sensor.id)} className="btn-eliminar">
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario para agregar/editar sensor */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-sensor">
            <h3>{sensorEditando ? 'Editar Sensor' : 'Agregar Nuevo Sensor'}</h3>
            
            <form onSubmit={guardarSensor}>
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
                <label>Nombre del Sensor:</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario(prev => ({...prev, nombre: e.target.value}))}
                  required
                  placeholder="Ej: Temperatura Ambiente"
                />
              </div>

              <div className="form-group">
                <label>Tipo de Sensor:</label>
                <select
                  value={formulario.tipo}
                  onChange={(e) => manejarCambioTipo(e.target.value)}
                >
                  {TIPOS_SENSORES.map(tipo => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.nombre} ({tipo.unidad})
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

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Mínimo:</label>
                  <input
                    type="number"
                    value={formulario.minValor}
                    onChange={(e) => setFormulario(prev => ({...prev, minValor: parseFloat(e.target.value)}))}
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Valor Máximo:</label>
                  <input
                    type="number"
                    value={formulario.maxValor}
                    onChange={(e) => setFormulario(prev => ({...prev, maxValor: parseFloat(e.target.value)}))}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Unidad:</label>
                <input
                  type="text"
                  value={formulario.unidad}
                  onChange={(e) => setFormulario(prev => ({...prev, unidad: e.target.value}))}
                  placeholder="°C, %, V, etc."
                />
              </div>

              <div className="form-group form-group-inline">
                <label>
                  <input
                    type="checkbox"
                    checked={formulario.activo}
                    onChange={(e) => setFormulario(prev => ({...prev, activo: e.target.checked}))}
                  />
                  Sensor activo
                </label>
              </div>

              {/* Configuración avanzada */}
              <details className="config-avanzada">
                <summary>Configuración Avanzada</summary>
                
                <div className="form-group">
                  <label>Frecuencia de Lectura (ms):</label>
                  <input
                    type="number"
                    value={formulario.configuracion.frecuenciaLectura}
                    onChange={(e) => setFormulario(prev => ({
                      ...prev,
                      configuracion: {
                        ...prev.configuracion,
                        frecuenciaLectura: parseInt(e.target.value)
                      }
                    }))}
                    min="1000"
                    max="60000"
                  />
                </div>

                <div className="form-group">
                  <label>Promedio de Muestras:</label>
                  <input
                    type="number"
                    value={formulario.configuracion.promedioMuestras}
                    onChange={(e) => setFormulario(prev => ({
                      ...prev,
                      configuracion: {
                        ...prev.configuracion,
                        promedioMuestras: parseInt(e.target.value)
                      }
                    }))}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formulario.configuracion.filtroRuido}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          filtroRuido: e.target.checked
                        }
                      }))}
                    />
                    Aplicar filtro de ruido
                  </label>
                </div>

                <h4>Calibración</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Offset:</label>
                    <input
                      type="number"
                      value={formulario.calibracion.offset}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        calibracion: {
                          ...prev.calibracion,
                          offset: parseFloat(e.target.value)
                        }
                      }))}
                      step="0.01"
                    />
                  </div>
                  <div className="form-group">
                    <label>Multiplicador:</label>
                    <input
                      type="number"
                      value={formulario.calibracion.multiplicador}
                      onChange={(e) => setFormulario(prev => ({
                        ...prev,
                        calibracion: {
                          ...prev.calibracion,
                          multiplicador: parseFloat(e.target.value)
                        }
                      }))}
                      step="0.01"
                    />
                  </div>
                </div>
              </details>

              <div className="form-acciones">
                <button type="submit" className="btn-guardar">
                  {sensorEditando ? 'Actualizar' : 'Agregar'} Sensor
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

export default GestionSensores;