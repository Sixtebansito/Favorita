'use client';

import { useState } from 'react';
import { crearUsuario, eliminarUsuario, cambiarPassword, toggleStatusUsuario } from './actions';
import styles from './usuario.module.css';

export default function UsuarioClient({ usuarios }: { usuarios: any[] }) {
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !email || !password) return;
    setError(null);
    const res = await crearUsuario({ name: nombre, email, password, role });
    if (res.error) {
      setError(res.error);
    } else {
      setNombre('');
      setEmail('');
      setPassword('');
      setRole('USER');
    }
  };

  const handleEliminar = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const res = await eliminarUsuario(id);
      if (res.error) alert(res.error);
    }
  };

  const handleCambiarPassword = async (id: string) => {
    const nueva = prompt('Ingrese la nueva contraseña para este usuario:');
    if (nueva !== null && nueva.trim() !== '') {
      const res = await cambiarPassword(id, nueva.trim());
      if (res.error) {
        alert(res.error);
      } else {
        alert('¡Contraseña actualizada con éxito!');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    const action = newState ? 'habilitar' : 'deshabilitar';
    if (confirm(`¿Estás seguro de ${action} este usuario?`)) {
      const res = await toggleStatusUsuario(id, newState);
      if (res.error) alert(res.error);
    }
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.alertError}>{error}</div>}

      <div className={styles.formContainer}>
        <h3>Añadir Nuevo Usuario</h3>
        <form onSubmit={handleCrear} className={styles.inlineForm}>
          <input 
            type="text" 
            placeholder="Nombre completo" 
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="USER">Usuario (Operador)</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <button type="submit" className="btn btn-primary">Registrar</button>
        </form>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={u.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span style={{ color: u.isActive !== false ? 'green' : 'red', fontWeight: 'bold', fontSize: '0.85rem' }}>
                    {u.isActive !== false ? 'Activo' : 'Suspendido'}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString('es-ES')}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => handleToggleStatus(u.id, u.isActive !== false)} className={u.isActive !== false ? "btn btn-danger" : "btn btn-primary"} style={{ padding: '0 12px', fontSize: '0.75rem', height: '32px' }}>
                      {u.isActive !== false ? 'Deshabilitar' : 'Habilitar'}
                    </button>
                    <button onClick={() => handleCambiarPassword(u.id)} className="btn btn-secondary" style={{ padding: '0 12px', fontSize: '0.75rem', height: '32px' }}>
                      Cambiar Clave
                    </button>
                    <button onClick={() => handleEliminar(u.id)} className="btn btn-danger" style={{ margin: 0, padding: '0 12px', fontSize: '0.75rem', height: '32px' }}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center'}}>No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
