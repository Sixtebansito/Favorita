'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registrarGasto, eliminarGasto, cerrarGastosMensuales } from './actions';
import { Wallet, Truck, Calendar, Tag, DollarSign, Trash2, Loader2, AlertCircle, Users, BarChart3, Archive } from 'lucide-react';

type Cabezal = {
  id: string;
  placa: string;
};

type Transportista = {
  id: string;
  name: string;
  cabezales: Cabezal[];
};

type Gasto = {
  id: string;
  fecha: Date;
  concepto: string;
  valor: number;
  descripcion: string | null;
  transportista: { name: string };
  cabezal: { placa: string } | null;
};

const CONCEPTOS = [
  'Combustible',
  'Llantas',
  'Peajes',
  'Viáticos',
  'Mantenimiento',
  'Otros'
];

const getColorForConcepto = (concepto: string) => {
  switch (concepto) {
    case 'Combustible': return { bg: '#dbeafe', color: '#1e40af' }; // Azul
    case 'Llantas': return { bg: '#f3f4f6', color: '#374151' }; // Gris
    case 'Peajes': return { bg: '#fef3c7', color: '#92400e' }; // Amarillo
    case 'Viáticos': return { bg: '#dcfce7', color: '#166534' }; // Verde
    case 'Mantenimiento': return { bg: '#fee2e2', color: '#991b1b' }; // Rojo
    default: return { bg: '#f3e8ff', color: '#6b21a8' }; // Morado
  }
};

export default function GastosClient({
  transportistas,
  gastosIniciales,
  cierresIniciales,
  isAdmin
}: {
  transportistas: Transportista[];
  gastosIniciales: any[];
  cierresIniciales: any[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [gastos, setGastos] = useState<Gasto[]>(gastosIniciales);
  const [cierres, setCierres] = useState<any[]>(cierresIniciales);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [cierreMesNombre, setCierreMesNombre] = useState('');
  const [cierreFechaHasta, setCierreFechaHasta] = useState('');

  // Form state
  const [transportistaId, setTransportistaId] = useState('');
  const [cabezalId, setCabezalId] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [concepto, setConcepto] = useState('Combustible');
  const [valor, setValor] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const selectedTransportista = transportistas.find(t => t.id === transportistaId);

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.valor), 0);

  const gastosPorConcepto = gastos.reduce((acc, gasto) => {
    acc[gasto.concepto] = (acc[gasto.concepto] || 0) + Number(gasto.valor);
    return acc;
  }, {} as Record<string, number>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportistaId) {
      setError('Seleccione un transportista');
      return;
    }
    if (!fecha || !concepto || !valor) {
      setError('Complete los campos obligatorios');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    const res = await registrarGasto({
      transportistaId,
      cabezalId: cabezalId || null,
      fecha,
      concepto,
      valor: parseFloat(valor),
      descripcion
    });

    if (res.success && res.gasto) {
      setSuccess('Gasto registrado con éxito');
      
      // Update local list for immediate feedback
      const newGasto = {
        ...res.gasto,
        transportista: { name: selectedTransportista?.name || '' },
        cabezal: cabezalId && selectedTransportista 
          ? { placa: selectedTransportista.cabezales.find(c => c.id === cabezalId)?.placa || '' } 
          : null
      };
      
      setGastos([newGasto, ...gastos]);
      
      // Reset form
      setValor('');
      setDescripcion('');
    } else {
      setError(res.error || 'Error al registrar el gasto');
    }

    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este gasto?')) return;
    
    // Optimistic UI update
    const previous = [...gastos];
    setGastos(gastos.filter(g => g.id !== id));
    
    const res = await eliminarGasto(id);
    if (!res.success) {
      alert(res.error || 'Error al eliminar');
      setGastos(previous); // revert
    }
  };

  const handleCerrarMes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportistaId || !cierreMesNombre) return;

    setIsLoading(true);
    const res = await cerrarGastosMensuales(transportistaId, cierreMesNombre, cierreFechaHasta || undefined);
    
    setIsLoading(false);
    if (res.success) {
      setShowCloseModal(false);
      setCierreMesNombre('');
      setCierreFechaHasta('');
      alert('Mes cerrado con éxito.');
      router.refresh();
    } else {
      alert(res.error || 'Error al cerrar el mes.');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '2rem', width: '100%', maxWidth: '100%' }}>
      {/* Formulario */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={20} />
          Registrar Nuevo Gasto
        </h2>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Transportista */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={14} /> Transportista *
              </label>
              <select 
                className="form-input" 
                value={transportistaId} 
                onChange={(e) => {
                  setTransportistaId(e.target.value);
                  setCabezalId('');
                }}
                required
              >
                <option value="">Seleccione...</option>
                {transportistas.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Cabezal (Opcional) */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={14} /> Cabezal (Opcional)
              </label>
              <select 
                className="form-input" 
                value={cabezalId} 
                onChange={(e) => setCabezalId(e.target.value)}
                disabled={!selectedTransportista}
              >
                <option value="">Ninguno / General</option>
                {selectedTransportista?.cabezales.map((c) => (
                  <option key={c.id} value={c.id}>{c.placa}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Fecha */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} /> Fecha *
              </label>
              <input 
                type="date" 
                className="form-input" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            {/* Concepto */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={14} /> Concepto *
              </label>
              <select 
                className="form-input" 
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                required
              >
                {CONCEPTOS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Valor */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={14} /> Valor ($) *
              </label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="form-input" 
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                required
              />
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label className="form-label">Descripción / Notas</label>
              <input 
                type="text" 
                placeholder="Ej. Cambio de llantas delanteras"
                className="form-input" 
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            Registrar Gasto
          </button>
        </form>
      </div>

      {/* Monitorización y Historial */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <BarChart3 size={20} />
            Gastos Activos (Sin Cerrar)
          </h2>
          
          <button 
            type="button" 
            className="btn btn-primary"
            disabled={!transportistaId || gastos.length === 0}
            onClick={() => setShowCloseModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Archive size={16} />
            Cerrar Gastos del Mes
          </button>
        </div>

        {gastos.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Gastos</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalGastos.toFixed(2)}</span>
            </div>
            
            {Object.entries(gastosPorConcepto)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 4) // Show top 4 max
              .map(([concepto, valor]) => {
              const colors = getColorForConcepto(concepto);
              return (
                <div key={concepto} style={{ padding: '1rem', backgroundColor: 'var(--muted)', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderLeft: `4px solid ${colors.color}` }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{concepto}</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>${valor.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="data-table-container" style={{ overflowX: 'auto', width: '100%', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
            <table className="data-table" style={{ width: '100%', minWidth: '600px', border: 'none' }}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th className="mobile-hidden">Detalle</th>
                <th className="mobile-hidden">Transportista / Placa</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                    No hay gastos registrados.
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => {
                  const colors = getColorForConcepto(gasto.concepto);
                  return (
                  <tr key={gasto.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={14} style={{ color: 'var(--muted-foreground)' }} />
                        {new Date(gasto.fecha).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '0.25rem 0.6rem', 
                        backgroundColor: colors.bg,
                        color: colors.color,
                        borderRadius: '1rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 600,
                        whiteSpace: 'nowrap'
                      }}>
                        {gasto.concepto}
                      </span>
                    </td>
                    <td className="mobile-hidden" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {gasto.descripcion || <span style={{ color: 'var(--muted-foreground)' }}>N/A</span>}
                    </td>
                    <td className="mobile-hidden">
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{gasto.transportista.name}</span>
                        {gasto.cabezal && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                            Placa: {gasto.cabezal.placa}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${Number(gasto.valor).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(gasto.id)}
                        className="btn btn-outline" 
                        style={{ padding: '0.5rem', color: '#ef4444', borderColor: '#ef4444' }}
                        title="Eliminar gasto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
            <tfoot>
              {gastos.length > 0 && (
                <tr style={{ backgroundColor: 'var(--muted)', fontWeight: 600 }}>
                  <td colSpan={2} style={{ textAlign: 'right' }}>Total Registrado:</td>
                  <td className="mobile-hidden"></td>
                  <td className="mobile-hidden"></td>
                  <td style={{ textAlign: 'right', fontSize: '1.1rem', color: 'var(--primary)' }}>
                    ${totalGastos.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      </div>

      {/* Historial de Cierres Mensuales */}
      <div className="card" style={{ padding: '1.5rem', backgroundColor: 'var(--card)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Archive size={20} />
          Meses Cerrados (Histórico)
        </h2>

        {cierres.length === 0 ? (
          <p style={{ color: 'var(--muted-foreground)', textAlign: 'center', padding: '1rem' }}>
            Aún no has cerrado gastos mensuales.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {cierres.map((cierre) => (
              <div key={cierre.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{cierre.mes_referencia}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Cerrado: {new Date(cierre.fecha_cierre).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
                  Compañía: <strong>{cierre.transportista.name}</strong>
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--muted)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Total Gastos:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>${cierre.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Cerrar Mes */}
      {showCloseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div style={{
            backgroundColor: 'var(--card)', padding: '2rem', borderRadius: 'var(--radius)',
            width: '100%', maxWidth: '400px', border: '1px solid var(--border)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>Cerrar Gastos Mensuales</h3>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              Se agruparán los gastos activos de <strong>{selectedTransportista?.name}</strong>.
            </p>

            <form onSubmit={handleCerrarMes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre del Mes / Referencia *</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Ej: Agosto 2026"
                  value={cierreMesNombre}
                  onChange={(e) => setCierreMesNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fecha Límite (Opcional)</label>
                <input 
                  type="date" 
                  className="form-input"
                  value={cierreFechaHasta}
                  onChange={(e) => setCierreFechaHasta(e.target.value)}
                />
                <small style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem', display: 'block' }}>
                  Si dejas esto en blanco, se cerrarán TODOS los gastos activos de la compañía. Si eliges una fecha, solo se cerrarán los gastos registrados hasta esa fecha inclusive.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setShowCloseModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={isLoading || !cierreMesNombre}
                >
                  {isLoading ? 'Cerrando...' : 'Confirmar Cierre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
