'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2, Plus, Trash2, FileText } from 'lucide-react';
import { addPrivateCode, updatePrivateCode, deletePrivateCode } from './actions';

export default function MisTarifariosClient({ misPrecios }: { misPrecios: any[] }) {
  const [editingPrecioId, setEditingPrecioId] = useState<string | null>(null);
  const [editPrecioDescripcion, setEditPrecioDescripcion] = useState('');
  const [editPrecioValor, setEditPrecioValor] = useState<number | string>('');
  
  const [isUpdating, setIsUpdating] = useState(false);
  
  // New Code State
  const [isAdding, setIsAdding] = useState(false);
  const [newCodigo, setNewCodigo] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newTipo, setNewTipo] = useState('FRIO');
  const [newValor, setNewValor] = useState<number | string>('');

  const handleSavePrecio = async (id: string) => {
    if (!editPrecioDescripcion.trim() || Number(editPrecioValor) < 0) return;
    setIsUpdating(true);
    const res = await updatePrivateCode(id, editPrecioDescripcion, Number(editPrecioValor));
    setIsUpdating(false);
    if (res.success) {
      setEditingPrecioId(null);
    } else {
      alert(res.error || 'Error al actualizar precio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este código privado?')) return;
    setIsUpdating(true);
    const res = await deletePrivateCode(id);
    setIsUpdating(false);
    if (!res.success) {
      alert(res.error || 'Error al eliminar');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodigo.trim() || !newDescripcion.trim() || Number(newValor) < 0) return;
    setIsUpdating(true);
    const res = await addPrivateCode(newCodigo, newDescripcion, newTipo, Number(newValor));
    setIsUpdating(false);
    if (res.success) {
      setIsAdding(false);
      setNewCodigo('');
      setNewDescripcion('');
      setNewValor('');
    } else {
      alert(res.error || 'Error al agregar');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Mis Tarifarios (Códigos Privados)</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Gestiona tus códigos de destino personalizados</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancelar' : 'Nuevo Código'}
        </button>
      </header>

      {isAdding && (
        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Crear Nuevo Código Privado</h2>
          <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label className="form-label">Código</label>
              <input type="text" className="form-input" value={newCodigo} onChange={e => setNewCodigo(e.target.value)} required placeholder="Ej: UIOMAN" />
            </div>
            <div>
              <label className="form-label">Descripción / Destino</label>
              <input type="text" className="form-input" value={newDescripcion} onChange={e => setNewDescripcion(e.target.value)} required placeholder="Manta local..." />
            </div>
            <div>
              <label className="form-label">Tipo</label>
              <select className="form-input" value={newTipo} onChange={e => setNewTipo(e.target.value)}>
                <option value="FRIO">FRÍO</option>
                <option value="SECO">SECO</option>
              </select>
            </div>
            <div>
              <label className="form-label">Valor Base</label>
              <input type="number" step="0.01" className="form-input" value={newValor} onChange={e => setNewValor(e.target.value)} required placeholder="0.00" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isUpdating} style={{ height: '40px' }}>
              {isUpdating ? <Loader2 className="animate-spin" size={16} /> : 'Guardar'}
            </button>
          </form>
        </div>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {misPrecios.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
            <p>No tienes códigos privados registrados.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Agrega un código nuevo usando el botón de arriba.</p>
          </div>
        ) : (
          <div className="data-table-container" style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '600px', border: 'none' }}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción / Destino</th>
                  <th>Tipo</th>
                  <th>Tarifario Base</th>
                  <th style={{ textAlign: 'right' }}>Valor Base</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {misPrecios.map((precio) => (
                  <tr key={precio.id}>
                    <td style={{ fontWeight: 600 }}>{precio.codigo}</td>
                    <td>
                      {editingPrecioId === precio.id ? (
                        <input 
                          type="text" 
                          className="form-input" 
                          value={editPrecioDescripcion} 
                          onChange={e => setEditPrecioDescripcion(e.target.value)} 
                          style={{ height: '32px' }}
                        />
                      ) : (
                        precio.descripcion
                      )}
                    </td>
                    <td>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        backgroundColor: precio.tipo === 'FRIO' ? '#e0f2fe' : '#fef3c7',
                        color: precio.tipo === 'FRIO' ? '#0369a1' : '#b45309',
                        fontWeight: 600
                      }}>
                        {precio.tipo}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                        {precio.tarifario?.nombre}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {editingPrecioId === precio.id ? (
                        <input 
                          type="number" 
                          step="0.01"
                          className="form-input" 
                          value={editPrecioValor} 
                          onChange={e => setEditPrecioValor(e.target.value)} 
                          style={{ height: '32px', width: '100px', marginLeft: 'auto' }}
                        />
                      ) : (
                        `$${precio.valor.toFixed(2)}`
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {editingPrecioId === precio.id ? (
                        <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                          <button type="button" onClick={() => handleSavePrecio(precio.id)} disabled={isUpdating} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button type="button" onClick={() => setEditingPrecioId(null)} disabled={isUpdating} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button type="button" onClick={() => { setEditingPrecioId(precio.id); setEditPrecioDescripcion(precio.descripcion); setEditPrecioValor(precio.valor); }} style={{ backgroundColor: '#ef4444', border: 'none', cursor: 'pointer', color: 'white', padding: '6px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }} title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button type="button" onClick={() => handleDelete(precio.id)} disabled={isUpdating} style={{ backgroundColor: 'transparent', border: '1px solid #ef4444', cursor: 'pointer', color: '#ef4444', padding: '6px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
