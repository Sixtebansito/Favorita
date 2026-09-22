'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { registrarCarga, obtenerCargas, eliminarCarga } from './actions';

export default function CargasClient({ cabezales }: { cabezales: any[] }) {
  const [cargas, setCargas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [formData, setFormData] = useState({
    cabezalId: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    cantidad: 1,
    valor: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    const res = await obtenerCargas();
    if (res.success && res.cargas) {
      setCargas(res.cargas);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cabezalId) {
      setMessage({ text: 'Por favor selecciona un cabezal', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);

    const res = await registrarCarga({
      ...formData,
      cantidad: Number(formData.cantidad),
      valor: Number(formData.valor)
    });

    if (res.success) {
      setMessage({ text: 'Carga registrada exitosamente', type: 'success' });
      setFormData(prev => ({ ...prev, descripcion: '', valor: 0, cantidad: 1 }));
      cargarDatos();
    } else {
      setMessage({ text: res.error || 'Error al registrar', type: 'error' });
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta carga?')) return;
    const res = await eliminarCarga(id);
    if (res.success) {
      cargarDatos();
    } else {
      alert(res.error || 'Error al eliminar');
    }
  };

  return (
    <div>
      <h1 className="page-title">Cargas (Ingresos por Cabezal)</h1>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Registrar Carga</h2>
        
        {message && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: 'var(--radius)', 
            marginBottom: '1rem',
            backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Cabezal</label>
            <select 
              className="form-input" 
              value={formData.cabezalId}
              onChange={e => setFormData({...formData, cabezalId: e.target.value})}
              required
            >
              <option value="">Seleccione un cabezal...</option>
              {cabezales.map(c => (
                <option key={c.id} value={c.id}>{c.placa} - {c.transportista.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.fecha}
              onChange={e => setFormData({...formData, fecha: e.target.value})}
              required
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Descripción</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ej. CARGA SANTO DOMINGO"
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Cantidad</label>
            <input 
              type="number" 
              min="1"
              className="form-input" 
              value={formData.cantidad}
              onChange={e => setFormData({...formData, cantidad: Number(e.target.value)})}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Valor Total</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={formData.valor}
              onChange={e => setFormData({...formData, valor: Number(e.target.value)})}
              required
            />
          </div>
          <div className="form-group">
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px' }} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              <span>Registrar</span>
            </button>
          </div>
        </form>
      </section>

      <section className="card" style={{ padding: '1.5rem' }}>
        <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Historial de Cargas</h2>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : cargas.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cabezal</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'right' }}>Cantidad</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th style={{ textAlign: 'center', width: '80px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cargas.map(carga => (
                  <tr key={carga.id}>
                    <td>{new Date(carga.fecha).toLocaleDateString()}</td>
                    <td><span style={{ fontWeight: 600 }}>{carga.cabezal.placa}</span></td>
                    <td>{carga.descripcion}</td>
                    <td style={{ textAlign: 'right' }}>{carga.cantidad}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                      ${carga.valor.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => handleEliminar(carga.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem 0' }}>
            No hay cargas registradas.
          </p>
        )}
      </section>
    </div>
  );
}
