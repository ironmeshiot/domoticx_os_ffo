// Panel para administrar widgets del dashboard
import React, { useState } from 'react';
import '../styles/PanelWidgets.css';

const WidgetItem = ({ item, tipo, onAdd, onRemove, onMove, onFavorite, isConfigured }) => (
  <li className="widget-item">
    <div className="widget-info">
      <i className={`widget-icon fas fa-${
        tipo === 'nodo' ? 'microchip' :
        tipo === 'sensor' ? 'thermometer-half' :
        'lightbulb'
      }`}></i>
      <div>
        <span className="widget-name">{item.nombre}</span>
        <span className="widget-type">{item.tipo}</span>
      </div>
    </div>
    <div className="widget-actions">
      {!isConfigured ? (
        <button className="btn-widget add" onClick={() => onAdd(tipo, item.id)} title="Agregar widget">
          <i className="fas fa-plus"></i>
        </button>
      ) : (
        <>
          <button className="btn-widget" onClick={() => onMove(item.id, 'arriba')} title="Mover arriba">
            <i className="fas fa-arrow-up"></i>
          </button>
          <button className="btn-widget" onClick={() => onMove(item.id, 'abajo')} title="Mover abajo">
            <i className="fas fa-arrow-down"></i>
          </button>
          <button 
            className={`btn-widget favorite ${item.favorito ? 'active' : ''}`}
            onClick={() => onFavorite(item.id)}
            title={item.favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
            <i className="fas fa-star"></i>
          </button>
          <button className="btn-widget remove" onClick={() => onRemove(tipo, item.id)} title="Quitar widget">
            <i className="fas fa-trash"></i>
          </button>
        </>
      )}
    </div>
  </li>
);

function PanelWidgets({ nodos, sensores, actuadores, configInicial, onGuardar }) {
  const [widgets, setWidgets] = useState(configInicial || []);
  const [agrupacion, setAgrupacion] = useState('tipo');

  // Función para agregar widget
  const agregarWidget = (tipo, id) => {
    if (!widgets.find(w => w.tipo === tipo && w.id === id)) {
      setWidgets([...widgets, { tipo, id, visible: true, orden: widgets.length }]);
    }
  };

  // Función para quitar widget
  const quitarWidget = (tipo, id) => {
    setWidgets(widgets.filter(w => !(w.tipo === tipo && w.id === id)));
  };

  // Función para cambiar orden
  const moverWidget = (idx, direccion) => {
    const nuevo = [...widgets];
    if (direccion === 'arriba' && idx > 0) {
      [nuevo[idx - 1], nuevo[idx]] = [nuevo[idx], nuevo[idx - 1]];
    }
    if (direccion === 'abajo' && idx < nuevo.length - 1) {
      [nuevo[idx], nuevo[idx + 1]] = [nuevo[idx + 1], nuevo[idx]];
    }
    setWidgets(nuevo.map((w, i) => ({ ...w, orden: i })));
  };

  // Función para marcar favorito
  const toggleFavorito = (idx) => {
    setWidgets(widgets.map((w, i) => i === idx ? { ...w, favorito: !w.favorito } : w));
  };

  // Guardar configuración
  const guardarConfig = () => {
    onGuardar(widgets);
  };

  // Render
  return (
    <div className="panel-widgets">
      <h3>
        <i className="fas fa-th-large"></i>
        Configurar Widgets del Dashboard
      </h3>
      
      <div className="control-panel">
        <select 
          className="agrupacion-select"
          value={agrupacion} 
          onChange={e => setAgrupacion(e.target.value)}>
          <option value="tipo">Agrupar por Tipo</option>
          <option value="ubicacion">Agrupar por Ubicación</option>
          <option value="favoritos">Agrupar por Favoritos</option>
        </select>
      </div>

      <div className="widgets-config-grid">
        <div className="available-widgets">
          <div className="section-nodos">
            <h4>
              <i className="fas fa-microchip"></i>
              Nodos Disponibles
            </h4>
            <ul className="widgets-list">
              {nodos.map(n => (
                <WidgetItem 
                  key={n.id}
                  item={n}
                  tipo="nodo"
                  onAdd={agregarWidget}
                  isConfigured={widgets.some(w => w.tipo === 'nodo' && w.id === n.id)}
                />
              ))}
            </ul>
          </div>

          <div className="section-sensores">
            <h4>
              <i className="fas fa-thermometer-half"></i>
              Sensores Disponibles
            </h4>
            <ul className="widgets-list">
              {sensores.map(s => (
                <WidgetItem 
                  key={s.id}
                  item={s}
                  tipo="sensor"
                  onAdd={agregarWidget}
                  isConfigured={widgets.some(w => w.tipo === 'sensor' && w.id === s.id)}
                />
              ))}
            </ul>
          </div>

          <div className="section-actuadores">
            <h4>
              <i className="fas fa-lightbulb"></i>
              Actuadores Disponibles
            </h4>
            <ul className="widgets-list">
              {actuadores.map(a => (
                <WidgetItem 
                  key={a.id}
                  item={a}
                  tipo="actuador"
                  onAdd={agregarWidget}
                  isConfigured={widgets.some(w => w.tipo === 'actuador' && w.id === a.id)}
                />
              ))}
            </ul>
          </div>
        </div>

        <div className="dashboard-preview">
          <div className="preview-title">
            <h4>
              <i className="fas fa-columns"></i>
              Widgets Configurados
            </h4>
          </div>
          <ul className="widgets-list">
            {widgets.map((w, idx) => {
              const item = w.tipo === 'nodo' ? nodos.find(n => n.id === w.id) :
                         w.tipo === 'sensor' ? sensores.find(s => s.id === w.id) :
                         actuadores.find(a => a.id === w.id);
              
              return item ? (
                <WidgetItem 
                  key={w.tipo + '-' + w.id}
                  item={{...item, favorito: w.favorito}}
                  tipo={w.tipo}
                  onRemove={quitarWidget}
                  onMove={(id, dir) => moverWidget(idx, dir)}
                  onFavorite={() => toggleFavorito(idx)}
                  isConfigured={true}
                />
              ) : null;
            })}
          </ul>
        </div>
      </div>

      <button className="btn-save" onClick={guardarConfig}>
        <i className="fas fa-save"></i>
        Guardar Configuración
      </button>
    </div>
  );
}

export default PanelWidgets;
