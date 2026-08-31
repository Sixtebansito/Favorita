'use client';

import { useState } from 'react';
import { actualizarValorGuia, eliminarGuiaDeSemana } from './actions';

export default function SemanasClient({ cierres }: { cierres: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Estado para la edición
  const [editingGuiaId, setEditingGuiaId] = useState<string | null>(null);
  const [editBaseValue, setEditBaseValue] = useState<number>(0);
  const [editTicketValue, setEditTicketValue] = useState<number>(0);
  const [editAdicionales, setEditAdicionales] = useState<{id: string, concepto?: string, valor: number}[]>([]);
  const [newAdicConcepto, setNewAdicConcepto] = useState('');
  const [newAdicValor, setNewAdicValor] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (cierres.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        No hay semanas cerradas registradas.
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEditingGuiaId(null);
  };

  const startEditing = (guia: any) => {
    setEditingGuiaId(guia.id);
    setEditBaseValue(guia.valor_base_cobrado);
    setEditTicketValue(guia.valor_ticket || 0);
    setEditAdicionales(guia.adicionales.map((a: any) => ({ id: a.id, valor: a.valor })));
  };

  const handleAdicionalChange = (id: string, newValue: string) => {
    setEditAdicionales(prev => prev.map(a => a.id === id ? { ...a, valor: parseFloat(newValue) || 0 } : a));
  };

  const handleAddNewAdicional = () => {
    if (!newAdicConcepto || !newAdicValor) return;
    setEditAdicionales([...editAdicionales, { id: `new_${Date.now()}`, concepto: newAdicConcepto, valor: parseFloat(newAdicValor) }]);
    setNewAdicConcepto('');
    setNewAdicValor('');
  };

  const saveEdit = async (cierreSemanaId: string) => {
    if (!editingGuiaId) return;
    setSaving(true);
    const res = await actualizarValorGuia(editingGuiaId, editBaseValue, editTicketValue, editAdicionales, cierreSemanaId);
    if (res.error) {
      alert("Error al actualizar: " + res.error);
    } else {
      setEditingGuiaId(null);
    }
    setSaving(false);
  };

  const handleDelete = async (guiaId: string, cierreSemanaId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta guía de la semana? Volverá al registro principal (Sin Cuadrar).")) {
      setDeletingId(guiaId);
      const res = await eliminarGuiaDeSemana(guiaId, cierreSemanaId);
      if (res.error) {
        alert("Error al eliminar: " + res.error);
      }
      setDeletingId(null);
    }
  };

  const granTotalSemanas = cierres.reduce((acc, c) => acc + c.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Total Histórico de Liquidaciones</h3>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem', marginTop: '0.25rem' }}>Suma de todas las semanas cerradas mostradas</p>
        </div>
        <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>${granTotalSemanas.toFixed(2)}</h2>
      </div>

      {cierres.map((cierre) => {
        // Agrupar guías por cabezal
        const guiasPorCabezal: Record<string, { cabezal: any, guias: any[], subtotal: number, totalTickets: number }> = {};
        
        cierre.guias.forEach((g: any) => {
          const placa = g.cabezal.placa;
          if (!guiasPorCabezal[placa]) {
            guiasPorCabezal[placa] = { cabezal: g.cabezal, guias: [], subtotal: 0, totalTickets: 0 };
          }
          
          const totalAdic = g.adicionales.reduce((acc: number, a: any) => acc + a.valor, 0);
          const totalGuia = g.valor_base_cobrado + totalAdic;
          
          guiasPorCabezal[placa].guias.push(g);
          guiasPorCabezal[placa].subtotal += totalGuia;
          guiasPorCabezal[placa].totalTickets += (g.valor_ticket || 0);
        });

        const cabezalesArray = Object.values(guiasPorCabezal);

        return (
          <div key={cierre.id} className="card" style={{ overflow: 'hidden' }}>
            <div 
              style={{ 
                padding: '2rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                backgroundColor: expandedId === cierre.id ? 'var(--muted)' : 'transparent',
                transition: 'background-color 0.2s'
              }}
              onClick={() => toggleExpand(cierre.id)}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                  {cierre.transportista.name}
                </h3>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Fecha de Cierre: {new Date(cierre.createdAt).toLocaleDateString('es-ES')} | Guías: {cierre.guias.length}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tickets</span>
                  <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    ${(cierre.total_tickets || 0).toFixed(2)}
                  </p>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--border)' }}></div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Semana</span>
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    ${cierre.total.toFixed(2)}
                  </p>
                </div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '1.25rem', marginLeft: '1rem' }}>
                  {expandedId === cierre.id ? '▼' : '▶'}
                </div>
              </div>
            </div>

            {expandedId === cierre.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '2rem', backgroundColor: 'var(--background)' }}>
                {cabezalesArray.map((grupo) => (
                  <div key={grupo.cabezal.id} style={{ marginBottom: '2.5rem' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cabezal: {grupo.cabezal.placa}</span>
                      <span>Subtotal: ${grupo.subtotal.toFixed(2)} <span style={{ opacity: 0.7, fontSize: '0.9rem', marginLeft: '0.5rem' }}>| Tickets: ${grupo.totalTickets.toFixed(2)}</span></span>
                    </h4>
                    
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Código(s)</th>
                            <th>Destino</th>
                            <th>Valor Base</th>
                            <th>Tickets</th>
                            <th>Adicionales</th>
                            <th>Total Guía</th>
                            <th>Fecha Guía</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.guias.map((guia: any) => {
                            const isEditing = editingGuiaId === guia.id;
                            const totalAdicionales = guia.adicionales.reduce((acc: number, a: any) => acc + a.valor, 0);
                            const totalGuia = guia.valor_base_cobrado + totalAdicionales;
                            
                            return (
                              <tr key={guia.id} style={isEditing ? { backgroundColor: 'var(--accent)' } : {}}>
                                <td>{guia.codigos_evaluados}</td>
                                <td>{guia.guiaPrecio?.descripcion || guia.cliente_destino}</td>
                                
                                {/* Valor Base */}
                                <td>
                                  {isEditing ? (
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      value={editBaseValue} 
                                      onChange={(e) => setEditBaseValue(parseFloat(e.target.value) || 0)}
                                      style={{ width: '100px' }}
                                    />
                                  ) : (
                                    `$${guia.valor_base_cobrado.toFixed(2)}`
                                  )}
                                </td>

                                {/* Tickets */}
                                <td>
                                  {isEditing ? (
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      value={editTicketValue} 
                                      onChange={(e) => setEditTicketValue(parseFloat(e.target.value) || 0)}
                                      style={{ width: '80px' }}
                                    />
                                  ) : (
                                    `$${(guia.valor_ticket || 0).toFixed(2)}`
                                  )}
                                </td>

                                {/* Adicionales */}
                                <td>
                                  {isEditing ? (
                                    <div>
                                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                                        {editAdicionales.map((ad: any) => (
                                          <li key={ad.id} style={{ marginBottom: '0.5rem' }}>
                                            {ad.concepto}: 
                                            <input 
                                              type="number" 
                                              className="form-input" 
                                              value={ad.valor || 0}
                                              onChange={(e) => handleAdicionalChange(ad.id, e.target.value)}
                                              style={{ width: '80px', display: 'inline-block', marginLeft: '0.5rem' }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                                        <input type="text" placeholder="Concepto" className="form-input" style={{ width: '100px', fontSize: '0.75rem', padding: '0.25rem' }} value={newAdicConcepto} onChange={e => setNewAdicConcepto(e.target.value)} />
                                        <input type="number" placeholder="Valor" className="form-input" style={{ width: '70px', fontSize: '0.75rem', padding: '0.25rem' }} value={newAdicValor} onChange={e => setNewAdicValor(e.target.value)} />
                                        <button className="btn btn-secondary" onClick={handleAddNewAdicional} type="button" style={{ padding: '0.25rem 0.5rem' }}>+</button>
                                      </div>
                                    </div>
                                  ) : (
                                    guia.adicionales.length > 0 ? (
                                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                                        {guia.adicionales.map((ad: any) => (
                                          <li key={ad.id}>
                                            {ad.concepto}: ${ad.valor.toFixed(2)}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span style={{ color: 'var(--muted-foreground)' }}>-</span>
                                    )
                                  )}
                                </td>

                                {/* Total */}
                                <td style={{ fontWeight: 500 }}>
                                  {isEditing ? (
                                    <span style={{ color: 'var(--muted-foreground)' }}>Auto...</span>
                                  ) : (
                                    `$${totalGuia.toFixed(2)}`
                                  )}
                                </td>
                                
                                {/* Fecha */}
                                <td>{new Date(guia.fecha_guia).toLocaleDateString('es-ES')}</td>

                                {/* Acciones */}
                                <td style={{ textAlign: 'right' }}>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <button className="btn btn-primary" onClick={() => saveEdit(cierre.id)} disabled={saving}>
                                        {saving ? '...' : 'Guardar'}
                                      </button>
                                      <button className="btn btn-secondary" onClick={() => setEditingGuiaId(null)} disabled={saving}>
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                      <button className="btn btn-secondary" onClick={() => startEditing(guia)} disabled={deletingId === guia.id}>
                                        Editar
                                      </button>
                                      <button 
                                        className="btn" 
                                        onClick={() => handleDelete(guia.id, cierre.id)} 
                                        disabled={deletingId === guia.id} 
                                        style={{ backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' }}
                                      >
                                        {deletingId === guia.id ? '...' : 'Eliminar'}
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
