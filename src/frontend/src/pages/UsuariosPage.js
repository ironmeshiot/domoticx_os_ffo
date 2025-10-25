// Página de gestión de usuarios
import React, { useState, useEffect } from 'react';
import '../styles/usuarios.css';

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    rol: 'usuario',
    activo: true
  });

  // Datos de ejemplo mientras no tengamos backend
  useEffect(() => {
    setUsuarios([
      { id: 1, nombre: 'Administrador', email: 'admin@domoticx.com', rol: 'administrador', activo: true, ultimoAcceso: '2025-10-07' },
      { id: 2, nombre: 'Usuario Demo', email: 'demo@domoticx.com', rol: 'usuario', activo: true, ultimoAcceso: '2025-10-06' }
    ]);
  }, []);

  const abrirFormulario = (usuario = null) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      setFormulario({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo
      });
    } else {
      setUsuarioEditando(null);
      setFormulario({
        nombre: '',
        email: '',
        rol: 'usuario',
        activo: true
      });
    }
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setUsuarioEditando(null);
  };

  const guardarUsuario = (e) => {
    e.preventDefault();
    
    if (usuarioEditando) {
      // Actualizar usuario existente
      setUsuarios(usuarios.map(u => 
        u.id === usuarioEditando.id 
          ? { ...u, ...formulario }
          : u
      ));
      alert('Usuario actualizado correctamente');
    } else {
      // Crear nuevo usuario
      const nuevoUsuario = {
        id: Date.now(),
        ...formulario,
        ultimoAcceso: 'Nunca'
      };
      setUsuarios([...usuarios, nuevoUsuario]);
      alert('Usuario creado correctamente');
    }
    
    cerrarFormulario();
  };

  const eliminarUsuario = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== id));
      alert('Usuario eliminado');
    }
  };

  const toggleEstado = (id) => {
    setUsuarios(usuarios.map(u => 
      u.id === id ? { ...u, activo: !u.activo } : u
    ));
  };

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <h2>Gestión de Usuarios</h2>
        <button className="btn-agregar" onClick={() => abrirFormulario()}>
          + Agregar Usuario
        </button>
      </div>

      <div className="usuarios-stats">
        <div className="stat-card">
          <h3>{usuarios.length}</h3>
          <p>Total Usuarios</p>
        </div>
        <div className="stat-card">
          <h3>{usuarios.filter(u => u.activo).length}</h3>
          <p>Usuarios Activos</p>
        </div>
        <div className="stat-card">
          <h3>{usuarios.filter(u => u.rol === 'administrador').length}</h3>
          <p>Administradores</p>
        </div>
      </div>

      <div className="usuarios-tabla">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td>
                  <span className={`rol-badge ${usuario.rol}`}>
                    {usuario.rol}
                  </span>
                </td>
                <td>
                  <button 
                    className={`estado-toggle ${usuario.activo ? 'activo' : 'inactivo'}`}
                    onClick={() => toggleEstado(usuario.id)}
                  >
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td>{usuario.ultimoAcceso}</td>
                <td>
                  <button onClick={() => abrirFormulario(usuario)} className="btn-editar">
                    Editar
                  </button>
                  <button onClick={() => eliminarUsuario(usuario.id)} className="btn-eliminar">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="modal-usuario">
            <h3>{usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            
            <form onSubmit={guardarUsuario}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({...formulario, nombre: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) => setFormulario({...formulario, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={formulario.rol}
                  onChange={(e) => setFormulario({...formulario, rol: e.target.value})}
                >
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                  <option value="operador">Operador</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formulario.activo}
                    onChange={(e) => setFormulario({...formulario, activo: e.target.checked})}
                  />
                  Usuario Activo
                </label>
              </div>

              <div className="form-acciones">
                <button type="submit" className="btn-guardar">
                  {usuarioEditando ? 'Actualizar' : 'Crear'} Usuario
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

export default UsuariosPage;
