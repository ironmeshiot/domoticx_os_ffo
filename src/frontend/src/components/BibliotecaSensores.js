// Componente para gestión de biblioteca de definiciones de sensores (catálogo técnico)
import React, { useState, useEffect, useCallback } from 'react';
import {
  getSensorDefinitions,
  createSensorDefinition,
  updateSensorDefinition,
  deleteSensorDefinition
} from '../services/nodeService';
import '../styles/Biblioteca.css';

const TIPOS_SENSORES = [
  'temperatura', 'humedad', 'luz', 'movimiento', 'gas', 'presion',
  'distancia', 'corriente', 'voltaje', 'ph', 'co2', 'sonido', 'otro'
];

const PROTOCOLOS = [
  'Digital', 'Analog', 'OneWire', 'I2C', 'SPI', 'UART', 'PWM', 'Modbus'
];

const TIPOS_PIN = [
  'digital', 'analog', 'pwm', 'i2c', 'spi', 'uart'
];

function BibliotecaSensores() {
  const [definiciones, setDefiniciones] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [definicionEditando, setDefinicionEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    tipo: 'temperatura',
    modelo: '',
    fabricante: '',
    protocolo: 'Digital',
    voltajeMin: 3.3,
    voltajeMax: 5.0,
    pinesRequeridos: 1,
    tipoPin: 'digital',
    unidad: '°C',
    minValor: -40,
    maxValor: 125,
    precisionValor: 0.5,
    tiempoLecturaMs: 100,
    calibracionDefault: {},
    configuracionDefault: {},
    especificaciones: {},
    notas: '',
    datasheetUrl: '',
    activo: true
  });

  const cargarDefiniciones = useCallback(async () => {
    try {
      const data = await getSensorDefinitions();
      setDefiniciones(data);
    } catch (error) {
      console.error('Error cargando definiciones de sensores:', error);
    }
  }, []);

  useEffect(() => {
    cargarDefiniciones();
  }, [cargarDefiniciones]);

  const abrirFormulario = (definicion = null) => {
    if (definicion) {
      setDefinicionEditando(definicion);
      setFormulario({
        nombre: definicion.nombre,
        tipo: definicion.tipo,
        modelo: definicion.modelo || '',
        fabricante: definicion.fabricante || '',
        protocolo: definicion.protocolo || 'Digital',
        voltajeMin: definicion.voltajeMin || 3.3,
        voltajeMax: definicion.voltajeMax || 5.0,
        pinesRequeridos: definicion.pinesRequeridos || 1,
        tipoPin: definicion.tipoPin || 'digital',
        unidad: definicion.unidad || '',
        minValor: definicion.minValor || 0,
        maxValor: definicion.maxValor || 100,
        precisionValor: definicion.precisionValor || null,
        tiempoLecturaMs: definicion.tiempoLecturaMs || null,
        calibracionDefault: definicion.calibracionDefault || {},
        configuracionDefault: definicion.configuracionDefault || {},
        especificaciones: definicion.especificaciones || {},
        notas: definicion.notas || '',
        datasheetUrl: definicion.datasheetUrl || '',
        activo: definicion.activo !== false
      });
    } else {
      setDefinicionEditando(null);
      setFormulario({
        nombre: '',
        tipo: 'temperatura',
        modelo: '',
        fabricante: '',
        protocolo: 'Digital',
        voltajeMin: 3.3,
        voltajeMax: 5.0,
        pinesRequeridos: 1,
        tipoPin: 'digital',
        unidad: '°C',
        minValor: -40,
        maxValor: 125,
        precisionValor: 0.5,
        tiempoLecturaMs: 100,
        calibracionDefault: {},
        configuracionDefault: {},
        especificaciones: {},
        notas: '',
        datasheetUrl: '',
        activo: true
      });
    }
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setDefinicionEditando(null);
  };

  const guardarDefinicion = async (e) => {
    e.preventDefault();

    try {
      if (definicionEditando) {
        await updateSensorDefinition(definicionEditando.id, formulario);
      } else {
        await createSensorDefinition(formulario);
      }
      
      await cargarDefiniciones();
      cerrarFormulario();
    } catch (error) {
      console.error('Error guardando definición:', error);
      alert('Error al guardar la definición: ' + error.message);
    }
  };

  const eliminarDefinicion = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar definición "${nombre}"?\n\nNo se puede eliminar si tiene asignaciones activas.`)) {
      return;
    }

    try {
      await deleteSensorDefinition(id);
      await cargarDefiniciones();
    } catch (error) {
      console.error('Error eliminando definición:', error);
      alert('Error: ' + error.message);
    }
  };

  const manejarCambio = (campo, valor) => {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
  };

  return (
    <div className="gestion-sensores">
      <div className="header-sensores">
        <h3>📚 Biblioteca de Sensores</h3>
        <p className="descripcion-biblioteca">
          Catálogo técnico de sensores: define las especificaciones físicas y lógicas de cada modelo.
        </p>
        <button className="btn-agregar" onClick={() => abrirFormulario()}>
          ➕ Nueva Definición de Sensor
        </button>
      </div>

      {mostrarFormulario && (
        <div className="modal-overlay" onClick={cerrarFormulario}>
          <div className="modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{definicionEditando ? '✏️ Editar Definición' : '➕ Nueva Definición de Sensor'}</h3>
              <button className="btn-cerrar" onClick={cerrarFormulario}>✕</button>
            </div>

            <form onSubmit={guardarDefinicion} className="form-definicion">
              <div className="seccion-form">
                <h4>Información General</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre Identificador *</label>
                    <input
                      type="text"
                      value={formulario.nombre}
                      onChange={(e) => manejarCambio('nombre', e.target.value)}
                      placeholder="ej: DHT22, BME280, HC-SR04"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo de Sensor *</label>
                    <select
                      value={formulario.tipo}
                      onChange={(e) => manejarCambio('tipo', e.target.value)}
                      required
                    >
                      {TIPOS_SENSORES.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Modelo Comercial</label>
                    <input
                      type="text"
                      value={formulario.modelo}
                      onChange={(e) => manejarCambio('modelo', e.target.value)}
                      placeholder="ej: DHT22, AM2302"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fabricante</label>
                    <input
                      type="text"
                      value={formulario.fabricante}
                      onChange={(e) => manejarCambio('fabricante', e.target.value)}
                      placeholder="ej: Aosong, Bosch"
                    />
                  </div>
                </div>
              </div>

              <div className="seccion-form">
                <h4>Características Eléctricas</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Protocolo de Comunicación *</label>
                    <select
                      value={formulario.protocolo}
                      onChange={(e) => manejarCambio('protocolo', e.target.value)}
                      required
                    >
                      {PROTOCOLOS.map(proto => (
                        <option key={proto} value={proto}>{proto}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Voltaje Mínimo (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formulario.voltajeMin}
                      onChange={(e) => manejarCambio('voltajeMin', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Voltaje Máximo (V)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formulario.voltajeMax}
                      onChange={(e) => manejarCambio('voltajeMax', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pines Requeridos *</label>
                    <input
                      type="number"
                      min="1"
                      value={formulario.pinesRequeridos}
                      onChange={(e) => manejarCambio('pinesRequeridos', parseInt(e.target.value))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo de Pin *</label>
                    <select
                      value={formulario.tipoPin}
                      onChange={(e) => manejarCambio('tipoPin', e.target.value)}
                      required
                    >
                      {TIPOS_PIN.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="seccion-form">
                <h4>Rangos y Precisión</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Unidad de Medida</label>
                    <input
                      type="text"
                      value={formulario.unidad}
                      onChange={(e) => manejarCambio('unidad', e.target.value)}
                      placeholder="°C, %, lux, cm, ppm"
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor Mínimo</label>
                    <input
                      type="number"
                      step="any"
                      value={formulario.minValor}
                      onChange={(e) => manejarCambio('minValor', parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor Máximo</label>
                    <input
                      type="number"
                      step="any"
                      value={formulario.maxValor}
                      onChange={(e) => manejarCambio('maxValor', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Precisión (±)</label>
                    <input
                      type="number"
                      step="any"
                      value={formulario.precisionValor || ''}
                      onChange={(e) => manejarCambio('precisionValor', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="ej: 0.5"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tiempo de Lectura (ms)</label>
                    <input
                      type="number"
                      value={formulario.tiempoLecturaMs || ''}
                      onChange={(e) => manejarCambio('tiempoLecturaMs', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="ej: 100"
                    />
                  </div>
                </div>
              </div>

              <div className="seccion-form">
                <h4>Información Adicional</h4>
                <div className="form-group">
                  <label>Notas / Compatibilidad</label>
                  <textarea
                    value={formulario.notas}
                    onChange={(e) => manejarCambio('notas', e.target.value)}
                    placeholder="Notas de instalación, compatibilidad con placas, advertencias, etc."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>URL Datasheet (opcional)</label>
                  <input
                    type="url"
                    value={formulario.datasheetUrl}
                    onChange={(e) => manejarCambio('datasheetUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancelar" onClick={cerrarFormulario}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {definicionEditando ? 'Actualizar' : 'Crear'} Definición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="lista-definiciones">
        {definiciones.length === 0 ? (
          <div className="mensaje-vacio">
            <p>📚 No hay definiciones de sensores en la biblioteca</p>
            <p className="subtexto">Crea definiciones técnicas de sensores para reutilizarlas en múltiples instalaciones</p>
          </div>
        ) : (
          <div className="grid-definiciones">
            {definiciones.map((def) => (
              <div key={def.id} className="card-definicion">
                <div className="card-header">
                  <h4>{def.nombre}</h4>
                  <span className={`badge badge-tipo-${def.tipo}`}>{def.tipo}</span>
                </div>

                <div className="card-body">
                  {def.modelo && <p><strong>Modelo:</strong> {def.modelo}</p>}
                  {def.fabricante && <p><strong>Fabricante:</strong> {def.fabricante}</p>}
                  <p><strong>Protocolo:</strong> {def.protocolo}</p>
                  <p><strong>Voltaje:</strong> {def.voltajeMin}V - {def.voltajeMax}V</p>
                  <p><strong>Pines:</strong> {def.pinesRequeridos} × {def.tipoPin}</p>
                  {def.unidad && (
                    <p><strong>Rango:</strong> {def.minValor} - {def.maxValor} {def.unidad}</p>
                  )}
                  {def.precisionValor && (
                    <p><strong>Precisión:</strong> ±{def.precisionValor} {def.unidad}</p>
                  )}
                  {def.notas && (
                    <p className="notas"><strong>Notas:</strong> {def.notas}</p>
                  )}
                </div>

                <div className="card-actions">
                  {def.datasheetUrl && (
                    <a href={def.datasheetUrl} target="_blank" rel="noopener noreferrer" className="btn-link">
                      📄 Datasheet
                    </a>
                  )}
                  <button className="btn-editar" onClick={() => abrirFormulario(def)}>
                    ✏️ Editar
                  </button>
                  <button className="btn-eliminar" onClick={() => eliminarDefinicion(def.id, def.nombre)}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BibliotecaSensores;
