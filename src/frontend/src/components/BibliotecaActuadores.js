// Componente para gestión de biblioteca de definiciones de actuadores (catálogo técnico)
import React, { useState, useEffect, useCallback } from 'react';
import {
  getActuatorDefinitions,
  createActuatorDefinition,
  updateActuatorDefinition,
  deleteActuatorDefinition
} from '../services/nodeService';
import '../styles/Biblioteca.css';

const TIPOS_ACTUADORES = [
  'relay', 'dimmer', 'servo', 'motor', 'led', 'ventilador', 
  'valvula', 'bomba', 'electrovalvula', 'otro'
];

const PROTOCOLOS = [
  'Digital', 'PWM', 'I2C', 'SPI', 'UART', 'Modbus', 'Analog'
];

const TIPOS_PIN = [
  'digital', 'pwm', 'i2c', 'spi', 'uart', 'analog'
];

function BibliotecaActuadores() {
  const [definiciones, setDefiniciones] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [definicionEditando, setDefinicionEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    tipo: 'relay',
    modelo: '',
    fabricante: '',
    protocolo: 'Digital',
    voltajeMin: 3.3,
    voltajeMax: 5.0,
    corrienteMax: null,
    potenciaMax: null,
    pinesRequeridos: 1,
    tipoPin: 'digital',
    rangoControlMin: 0,
    rangoControlMax: 1,
    tiempoRespuestaMs: 10,
    configuracionDefault: {},
    especificaciones: {},
    notas: '',
    datasheetUrl: '',
    activo: true
  });

  const cargarDefiniciones = useCallback(async () => {
    try {
      const data = await getActuatorDefinitions();
      setDefiniciones(data);
    } catch (error) {
      console.error('Error cargando definiciones de actuadores:', error);
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
        corrienteMax: definicion.corrienteMax || null,
        potenciaMax: definicion.potenciaMax || null,
        pinesRequeridos: definicion.pinesRequeridos || 1,
        tipoPin: definicion.tipoPin || 'digital',
        rangoControlMin: definicion.rangoControlMin ?? 0,
        rangoControlMax: definicion.rangoControlMax ?? 1,
        tiempoRespuestaMs: definicion.tiempoRespuestaMs || null,
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
        tipo: 'relay',
        modelo: '',
        fabricante: '',
        protocolo: 'Digital',
        voltajeMin: 3.3,
        voltajeMax: 5.0,
        corrienteMax: null,
        potenciaMax: null,
        pinesRequeridos: 1,
        tipoPin: 'digital',
        rangoControlMin: 0,
        rangoControlMax: 1,
        tiempoRespuestaMs: 10,
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
        await updateActuatorDefinition(definicionEditando.id, formulario);
      } else {
        await createActuatorDefinition(formulario);
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
      await deleteActuatorDefinition(id);
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
    <div className="gestion-actuadores">
      <div className="header-actuadores">
        <h3>📚 Biblioteca de Actuadores</h3>
        <p className="descripcion-biblioteca">
          Catálogo técnico de actuadores: define las especificaciones físicas y lógicas de cada modelo.
        </p>
        <button className="btn-agregar" onClick={() => abrirFormulario()}>
          ➕ Nueva Definición de Actuador
        </button>
      </div>

      {mostrarFormulario && (
        <div className="modal-overlay" onClick={cerrarFormulario}>
          <div className="modal-form" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{definicionEditando ? '✏️ Editar Definición' : '➕ Nueva Definición de Actuador'}</h3>
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
                      placeholder="ej: Relay 5V, Servo SG90, Dimmer LED"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Tipo de Actuador *</label>
                    <select
                      value={formulario.tipo}
                      onChange={(e) => manejarCambio('tipo', e.target.value)}
                      required
                    >
                      {TIPOS_ACTUADORES.map(tipo => (
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
                      placeholder="ej: SRD-05VDC-SL-C, SG90"
                    />
                  </div>

                  <div className="form-group">
                    <label>Fabricante</label>
                    <input
                      type="text"
                      value={formulario.fabricante}
                      onChange={(e) => manejarCambio('fabricante', e.target.value)}
                      placeholder="ej: Songle, TowerPro"
                    />
                  </div>
                </div>
              </div>

              <div className="seccion-form">
                <h4>Características Eléctricas</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Protocolo de Control *</label>
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
                    <label>Corriente Máxima (A)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formulario.corrienteMax || ''}
                      onChange={(e) => manejarCambio('corrienteMax', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="ej: 10"
                    />
                  </div>

                  <div className="form-group">
                    <label>Potencia Máxima (W)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formulario.potenciaMax || ''}
                      onChange={(e) => manejarCambio('potenciaMax', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="ej: 2200"
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
                <h4>Rangos de Control</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Control Mínimo</label>
                    <input
                      type="number"
                      step="any"
                      value={formulario.rangoControlMin}
                      onChange={(e) => manejarCambio('rangoControlMin', parseFloat(e.target.value))}
                      placeholder="ej: 0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Valor Control Máximo</label>
                    <input
                      type="number"
                      step="any"
                      value={formulario.rangoControlMax}
                      onChange={(e) => manejarCambio('rangoControlMax', parseFloat(e.target.value))}
                      placeholder="ej: 255 (PWM), 1 (Digital)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tiempo de Respuesta (ms)</label>
                    <input
                      type="number"
                      value={formulario.tiempoRespuestaMs || ''}
                      onChange={(e) => manejarCambio('tiempoRespuestaMs', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="ej: 10"
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
                    placeholder="Notas de instalación, requerimientos de alimentación, advertencias, etc."
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
            <p>📚 No hay definiciones de actuadores en la biblioteca</p>
            <p className="subtexto">Crea definiciones técnicas de actuadores para reutilizarlas en múltiples instalaciones</p>
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
                  {def.corrienteMax && <p><strong>Corriente máx:</strong> {def.corrienteMax} A</p>}
                  {def.potenciaMax && <p><strong>Potencia máx:</strong> {def.potenciaMax} W</p>}
                  <p><strong>Pines:</strong> {def.pinesRequeridos} × {def.tipoPin}</p>
                  <p><strong>Control:</strong> {def.rangoControlMin} - {def.rangoControlMax}</p>
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

export default BibliotecaActuadores;
