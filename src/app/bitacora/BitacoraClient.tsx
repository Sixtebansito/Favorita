'use client';

import { useState, useEffect } from 'react';
import { getMantenimientos, crearMantenimiento, eliminarMantenimiento } from './actions';
import { Save, Loader2 } from 'lucide-react';
import { confirmar, mostrarAlerta } from '@/app/utils/alerts';

export default function BitacoraClient({ transportistasIniciales }: { transportistasIniciales: any[] }) {
  const [transportistas] = useState(transportistasIniciales);
  const [selectedTransportista, setSelectedTransportista] = useState<string>('');
  const [selectedCabezal, setSelectedCabezal] = useState<string>('');
  
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Cambio de aceite',
    kilometraje: '',
    costo: '',
    descripcion: ''
  });

  const tiposComunes = [
    'Cambio de aceite',
    'Frenos',
    'Llantas',
    'Motor',
    'Transmisión',
    'Filtros',
    'Revisión general',
    'Otro'
  ];

  const cabezalesDisponibles = transportistas.find(t => t.id === selectedTransportista)?.cabezales || [];

  useEffect(() => {
    if (selectedCabezal) {
      cargarMantenimientos(selectedCabezal);
    } else {
      setMantenimientos([]);
    }
  }, [selectedCabezal]);

  const cargarMantenimientos = async (cabezalId: string) => {
    setIsLoading(true);
    const res = await getMantenimientos(cabezalId);
    if (res.success) {
      setMantenimientos(res.mantenimientos);
    } else {
      mostrarAlerta('Error al cargar la bitácora', 'error');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabezal) return mostrarAlerta('Selecciona un cabezal', 'info');

    setIsSubmitting(true);
    const res = await crearMantenimiento({
      cabezalId: selectedCabezal,
      fecha: formData.fecha,
      tipo: formData.tipo,
      descripcion: formData.descripcion || undefined,
      kilometraje: formData.kilometraje ? parseInt(formData.kilometraje) : undefined,
      costo: formData.costo ? parseFloat(formData.costo) : undefined
    });

    if (res.success) {
      mostrarAlerta('Mantenimiento registrado', 'info');
      setFormData({
        ...formData,
        descripcion: '',
        kilometraje: '',
        costo: ''
      });
      cargarMantenimientos(selectedCabezal);
    } else {
      mostrarAlerta(res.error || 'Error al guardar', 'error');
    }
    setIsSubmitting(false);
  };

  const handleEliminar = async (id: string) => {
    if (!await confirmar('¿Estás seguro de eliminar este registro?')) return;
    
    const res = await eliminarMantenimiento(id);
    if (res.success) {
      mostrarAlerta('Registro eliminado', 'info');
      cargarMantenimientos(selectedCabezal);
    } else {
      mostrarAlerta('Error al eliminar', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Selectores */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="form-label">Transportista</label>
          <select
            className="form-input"
            value={selectedTransportista}
            onChange={(e) => {
              setSelectedTransportista(e.target.value);
              setSelectedCabezal('');
            }}
          >
            <option value="">Seleccione un transportista</option>
            {transportistas.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="form-label">Cabezal / Placa</label>
          <select
            className="form-input"
            value={selectedCabezal}
            onChange={(e) => setSelectedCabezal(e.target.value)}
            disabled={!selectedTransportista || cabezalesDisponibles.length === 0}
          >
            <option value="">Seleccione un cabezal</option>
            {cabezalesDisponibles.map((c: any) => (
              <option key={c.id} value={c.id}>{c.placa}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedCabezal && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Registrar Mantenimiento</h3>
              
              <div>
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={formData.fecha}
                  onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label">Tipo de Mantenimiento</label>
                <select
                  className="form-input"
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                >
                  {tiposComunes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {formData.tipo === 'Otro' && (
                <div>
                  <label className="form-label">Especificar Tipo</label>
                  <input
                    type="text"
                    required
                    className="form-input placeholder-gray-300"
                    placeholder="Ej. Cambio de batería"
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className="form-label">Kilometraje</label>
                <input
                  type="number"
                  className="form-input placeholder-gray-300"
                  placeholder="Ej. 150000"
                  value={formData.kilometraje}
                  onChange={(e) => setFormData({...formData, kilometraje: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label">Costo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input placeholder-gray-300"
                  placeholder="Opcional"
                  value={formData.costo}
                  onChange={(e) => setFormData({...formData, costo: e.target.value})}
                />
              </div>

              <div>
                <label className="form-label">Detalles</label>
                <textarea
                  className="form-input placeholder-gray-300"
                  rows={3}
                  placeholder="Notas adicionales, taller, repuestos..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </form>
          </div>

          {/* Tabla */}
          <div className="lg:col-span-2">
            <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Historial de Mantenimientos
              </h3>
              
              <div className="data-table-container" style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
                <table className="data-table" style={{ width: '100%', minWidth: '600px', border: 'none' }}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Km</th>
                      <th>Costo</th>
                      <th className="mobile-hidden">Detalles</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>Cargando...</td></tr>
                    ) : mantenimientos.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>No hay registros para este cabezal.</td></tr>
                    ) : (
                      mantenimientos.map((m) => (
                        <tr key={m.id}>
                          <td>
                            {new Date(m.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC' })}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {m.tipo}
                          </td>
                          <td>
                            {m.kilometraje ? m.kilometraje.toLocaleString() : '-'}
                          </td>
                          <td>
                            {m.costo ? `$${m.costo.toFixed(2)}` : '-'}
                          </td>
                          <td className="mobile-hidden" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={m.descripcion}>
                            {m.descripcion || '-'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleEliminar(m.id)}
                              style={{ color: 'var(--destructive)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
