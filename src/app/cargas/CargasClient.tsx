'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { registrarCarga, obtenerCargas, eliminarCarga } from './actions';
import { confirmar, mostrarAlerta } from '@/app/utils/alerts';

export default function CargasClient({ cabezales }: { cabezales: any[] }) {
  const [cargas, setCargas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transportistaId, setTransportistaId] = useState<string>('');

  const [formData, setFormData] = useState({
    cabezalId: '',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    cantidad: 1,
    valor: 0
  });

  const transportistasUnicos = Array.from(new Set(cabezales.map((c: any) => c.transportistaId))).map(
    id => cabezales.find((c: any) => c.transportistaId === id)!.transportista
  );

  const cabezalesFiltrados = cabezales.filter((c: any) => c.transportistaId === transportistaId);

  // Auto-seleccionar transportista si solo hay 1
  useEffect(() => {
    if (transportistasUnicos.length === 1 && !transportistaId) {
      setTransportistaId(transportistasUnicos[0].id);
    }
  }, [transportistasUnicos, transportistaId]);

  // Auto-seleccionar cabezal o limpiar si cambias de transportista
  useEffect(() => {
    if (cabezalesFiltrados.length === 1 && !formData.cabezalId) {
      setFormData(prev => ({ ...prev, cabezalId: cabezalesFiltrados[0].id }));
    } else if (cabezalesFiltrados.length === 0 || !cabezalesFiltrados.find((c: any) => c.id === formData.cabezalId)) {
      setFormData(prev => ({ ...prev, cabezalId: '' }));
    }
  }, [cabezalesFiltrados, formData.cabezalId]);

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
      mostrarAlerta('Por favor selecciona un cabezal', 'info');
      return;
    }
    setIsSubmitting(true);

    const res = await registrarCarga({
      ...formData,
      cantidad: Number(formData.cantidad),
      valor: Number(formData.valor)
    });

    if (res.success) {
      mostrarAlerta('Carga registrada exitosamente', 'success');
      setFormData(prev => ({ ...prev, descripcion: '', valor: 0, cantidad: 1 }));
      cargarDatos();
    } else {
      mostrarAlerta(res.error || 'Error al registrar', 'error');
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (id: string) => {
    if (!await confirmar('¿Estás seguro de eliminar esta carga?')) return;
    const res = await eliminarCarga(id);
    if (res.success) {
      cargarDatos();
    } else {
      mostrarAlerta(res.error || 'Error al eliminar', 'error');
    }
  };

  return (
    <div>
      <h1 className="page-title">Cargas (Ingresos por Cabezal)</h1>

      <section className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Registrar Carga</h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group">
            <label className="form-label">Transportista</label>
            <select 
              className="form-input" 
              value={transportistaId}
              onChange={e => setTransportistaId(e.target.value)}
              required
            >
              <option value="">Seleccione compañía...</option>
              {transportistasUnicos.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Cabezal</label>
            <select 
              className="form-input" 
              value={formData.cabezalId}
              onChange={e => setFormData({...formData, cabezalId: e.target.value})}
              required
              disabled={!transportistaId}
            >
              <option value="">Seleccione cabezal...</option>
              {cabezalesFiltrados.map(c => (
                <option key={c.id} value={c.id}>{c.placa} ({c.tipo || 'CABEZAL'})</option>
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
                    <td>{new Date(carga.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</td>
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
