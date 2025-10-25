// Página de configuración del sistema
import React, { useState } from 'react';
import '../styles/ConfigPage.css';

function ConfigPage() {
  const [configGeneral, setConfigGeneral] = useState({
    nombreSistema: 'DomoticX OS FFO',
    tema: 'claro',
    idioma: 'es',
    zonaTiempo: 'America/Mexico_City',
    formatoHora: '24h',
    intervaloRefresh: 5000,
    intervaloPing: 30000,
    timeoutDispositivo: 60000,
    logLevel: 'info'
  });

  const [configSeguridad, setConfigSeguridad] = useState({
    tiempoSesion: 30,
    intentosMaximos: 3,
    complejidadPass: 'media',
    backupAutomatico: true,
    intervaloBackup: 'diario',
    retencionLogs: 30,
    notificaciones: {
      email: true,
      telegram: false,
      pushover: false
    }
  });

  const [configMqtt, setConfigMqtt] = useState({
    habilitado: true,
    broker: 'localhost',
    puerto: 1883,
    usuario: 'domoticx',
    topicBase: 'domoticx/',
    qos: 1,
    ssl: false
  });

  const [configBackup] = useState({
    ultimoBackup: '2025-10-06 23:00:00',
    proximoBackup: '2025-10-07 23:00:00',
    backupsGuardados: 7,
    ubicacion: '/backups/',
    tipo: 'completo'
  });

  const guardarConfigGeneral = (e) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar en backend
    alert('Configuración general guardada');
  };

  const guardarConfigSeguridad = (e) => {
    e.preventDefault();
    alert('Configuración de seguridad guardada');
  };

  const guardarConfigMqtt = (e) => {
    e.preventDefault();
    alert('Configuración MQTT guardada');
  };

  const realizarBackup = () => {
    alert('Backup iniciado...');
    // Aquí iría la lógica del backup
  };

  const restaurarBackup = (fecha) => {
    if (window.confirm(`¿Estás seguro de restaurar el backup del ${fecha}?`)) {
      alert('Restauración iniciada...');
    }
  };

  return (
    <div className="config-page">
      <h2>Configuración del Sistema</h2>

      <div className="config-grid">
        {/* Configuración General */}
        <section className="config-section">
          <h3>Configuración General</h3>
          <form onSubmit={guardarConfigGeneral}>
            <div className="form-group">
              <label>Nombre del Sistema:</label>
              <input
                type="text"
                value={configGeneral.nombreSistema}
                onChange={(e) => setConfigGeneral({...configGeneral, nombreSistema: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Tema:</label>
              <select
                value={configGeneral.tema}
                onChange={(e) => setConfigGeneral({...configGeneral, tema: e.target.value})}
              >
                <option value="claro">Claro</option>
                <option value="oscuro">Oscuro</option>
                <option value="auto">Auto (Sistema)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Idioma:</label>
              <select
                value={configGeneral.idioma}
                onChange={(e) => setConfigGeneral({...configGeneral, idioma: e.target.value})}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>

            <div className="form-group">
              <label>Zona Horaria:</label>
              <select
                value={configGeneral.zonaTiempo}
                onChange={(e) => setConfigGeneral({...configGeneral, zonaTiempo: e.target.value})}
              >
                <option value="America/Mexico_City">Ciudad de México</option>
                <option value="America/Bogota">Bogotá</option>
                <option value="America/Santiago">Santiago</option>
                <option value="Europe/Madrid">Madrid</option>
              </select>
            </div>

            <div className="form-group">
              <label>Intervalo de Actualización (ms):</label>
              <input
                type="number"
                value={configGeneral.intervaloRefresh}
                onChange={(e) => setConfigGeneral({...configGeneral, intervaloRefresh: parseInt(e.target.value)})}
                min="1000"
                max="60000"
                step="1000"
              />
            </div>

            <button type="submit" className="btn-guardar">
              Guardar Configuración General
            </button>
          </form>
        </section>

        {/* Configuración de Seguridad */}
        <section className="config-section">
          <h3>Seguridad y Respaldos</h3>
          <form onSubmit={guardarConfigSeguridad}>
            <div className="form-group">
              <label>Tiempo de Sesión (minutos):</label>
              <input
                type="number"
                value={configSeguridad.tiempoSesion}
                onChange={(e) => setConfigSeguridad({...configSeguridad, tiempoSesion: parseInt(e.target.value)})}
                min="5"
                max="120"
              />
            </div>

            <div className="form-group">
              <label>Intentos Máximos de Login:</label>
              <input
                type="number"
                value={configSeguridad.intentosMaximos}
                onChange={(e) => setConfigSeguridad({...configSeguridad, intentosMaximos: parseInt(e.target.value)})}
                min="1"
                max="10"
              />
            </div>

            <div className="form-group">
              <label>Complejidad de Contraseña:</label>
              <select
                value={configSeguridad.complejidadPass}
                onChange={(e) => setConfigSeguridad({...configSeguridad, complejidadPass: e.target.value})}
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={configSeguridad.backupAutomatico}
                  onChange={(e) => setConfigSeguridad({...configSeguridad, backupAutomatico: e.target.checked})}
                />
                Backup Automático
              </label>
            </div>

            <div className="form-group">
              <label>Retención de Logs (días):</label>
              <input
                type="number"
                value={configSeguridad.retencionLogs}
                onChange={(e) => setConfigSeguridad({...configSeguridad, retencionLogs: parseInt(e.target.value)})}
                min="1"
                max="365"
              />
            </div>

            <button type="submit" className="btn-guardar">
              Guardar Configuración de Seguridad
            </button>
          </form>
        </section>

        {/* Configuración MQTT */}
        <section className="config-section">
          <h3>Configuración MQTT</h3>
          <form onSubmit={guardarConfigMqtt}>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={configMqtt.habilitado}
                  onChange={(e) => setConfigMqtt({...configMqtt, habilitado: e.target.checked})}
                />
                Habilitar MQTT
              </label>
            </div>

            <div className="form-group">
              <label>Broker:</label>
              <input
                type="text"
                value={configMqtt.broker}
                onChange={(e) => setConfigMqtt({...configMqtt, broker: e.target.value})}
                disabled={!configMqtt.habilitado}
              />
            </div>

            <div className="form-group">
              <label>Puerto:</label>
              <input
                type="number"
                value={configMqtt.puerto}
                onChange={(e) => setConfigMqtt({...configMqtt, puerto: parseInt(e.target.value)})}
                disabled={!configMqtt.habilitado}
              />
            </div>

            <div className="form-group">
              <label>Usuario MQTT:</label>
              <input
                type="text"
                value={configMqtt.usuario}
                onChange={(e) => setConfigMqtt({...configMqtt, usuario: e.target.value})}
                disabled={!configMqtt.habilitado}
              />
            </div>

            <div className="form-group">
              <label>Topic Base:</label>
              <input
                type="text"
                value={configMqtt.topicBase}
                onChange={(e) => setConfigMqtt({...configMqtt, topicBase: e.target.value})}
                disabled={!configMqtt.habilitado}
              />
            </div>

            <button type="submit" className="btn-guardar" disabled={!configMqtt.habilitado}>
              Guardar Configuración MQTT
            </button>
          </form>
        </section>

        {/* Backups */}
        <section className="config-section">
          <h3>Backups del Sistema</h3>
          
          <div className="backup-info">
            <p>Último backup: {configBackup.ultimoBackup}</p>
            <p>Próximo backup: {configBackup.proximoBackup}</p>
            <p>Backups guardados: {configBackup.backupsGuardados}</p>
          </div>

          <button onClick={realizarBackup} className="btn-backup">
            Realizar Backup Manual
          </button>

          <div className="backup-list">
            <h4>Backups Disponibles</h4>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Tamaño</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2025-10-06 23:00:00</td>
                  <td>Completo</td>
                  <td>2.3 MB</td>
                  <td>
                    <button onClick={() => restaurarBackup('2025-10-06 23:00:00')}>
                      Restaurar
                    </button>
                    <button>Descargar</button>
                  </td>
                </tr>
                <tr>
                  <td>2025-10-05 23:00:00</td>
                  <td>Completo</td>
                  <td>2.1 MB</td>
                  <td>
                    <button onClick={() => restaurarBackup('2025-10-05 23:00:00')}>
                      Restaurar
                    </button>
                    <button>Descargar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ConfigPage;
