'use client';

import { useState } from 'react';
import { crearUsuario, eliminarUsuario } from './actions';
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
          <button type="submit" className="btn-primary">Registrar</button>
        </form>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
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
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleEliminar(u.id)} className={styles.deleteBtn}>
                    Eliminar
                  </button>
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
