'use client';

import { useState } from 'react';
import { actualizarValorGuia, eliminarGuiaDeSemana } from './actions';

export default function SemanasClient({ cierres, cabezales }: { cierres: any[], cabezales?: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Estado para la edición
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupEdits, setGroupEdits] = useState<Record<string, { baseValue: number, ticketValue: number, adicionales: any[], cabezalId: string, newAdicConcepto?: string, newAdicValor?: string }>>({});

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [filtroTransportista, setFiltroTransportista] = useState('');

  // Estados para Unir Semanas
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedParaUnir, setSelectedParaUnir] = useState<string[]>([]);

  if (cierres.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
        No hay semanas cerradas registradas.
      </div>
    );
  }

  const transportistasUnicos = Array.from(new Set(cierres.map(c => c.transportistaId))).map(
    id => cierres.find(c => c.transportistaId === id)!.transportista
  );

  const cierresFiltrados = filtroTransportista ? cierres.filter(c => c.transportistaId === filtroTransportista) : cierres;

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setEditingGroupId(null);
  };

  const startGroupEditing = (grupo: any) => {
    setEditingGroupId(grupo.cabezal.id);
    const initialEdits: any = {};
    grupo.guias.forEach((guia: any) => {
      initialEdits[guia.id] = {
        baseValue: guia.valor_base_cobrado,
        ticketValue: guia.valor_ticket || 0,
        adicionales: guia.adicionales.map((a: any) => ({ id: a.id, concepto: a.concepto, valor: a.valor })),
        cabezalId: guia.cabezalId,
        newAdicConcepto: '',
        newAdicValor: ''
      };
    });
    setGroupEdits(initialEdits);
  };

  const cancelGroupEditing = () => {
    setEditingGroupId(null);
    setGroupEdits({});
  };

  const handleGroupEditChange = (guiaId: string, field: string, value: any) => {
    setGroupEdits(prev => ({
      ...prev,
      [guiaId]: {
        ...prev[guiaId],
        [field]: value
      }
    }));
  };

  const handleGroupAdicionalChange = (guiaId: string, adicId: string, newValue: string) => {
    setGroupEdits(prev => {
      const g = prev[guiaId];
      return {
        ...prev,
        [guiaId]: {
          ...g,
          adicionales: g.adicionales.map(a => a.id === adicId ? { ...a, valor: parseFloat(newValue) || 0 } : a)
        }
      };
    });
  };

  const handleAddNewAdicionalGroup = (guiaId: string) => {
    setGroupEdits(prev => {
      const g = prev[guiaId];
      if (!g.newAdicConcepto || !g.newAdicValor) return prev;
      return {
        ...prev,
        [guiaId]: {
          ...g,
          adicionales: [...g.adicionales, { id: `new_${Date.now()}`, concepto: g.newAdicConcepto, valor: parseFloat(g.newAdicValor) }],
          newAdicConcepto: '',
          newAdicValor: ''
        }
      };
    });
  };

  const saveGroupEdit = async (cierreSemanaId: string) => {
    if (!editingGroupId) return;
    setSaving(true);
    
    // Preparar el arreglo de updates
    const updates = Object.keys(groupEdits).map(guiaId => {
      const edit = groupEdits[guiaId];
      return {
        guiaId,
        nuevoValorBase: edit.baseValue,
        nuevoValorTicket: edit.ticketValue,
        nuevosAdicionales: edit.adicionales,
        cabezalId: edit.cabezalId
      };
    });

    const { actualizarValoresMultiples } = await import('./actions');
    const res = await actualizarValoresMultiples(updates, cierreSemanaId);
    
    if (res.error) {
      alert("Error al actualizar: " + res.error);
    } else {
      setEditingGroupId(null);
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

  const toggleMergeSelection = (cierre: any) => {
    if (selectedParaUnir.includes(cierre.id)) {
      setSelectedParaUnir(selectedParaUnir.filter(id => id !== cierre.id));
    } else {
      if (selectedParaUnir.length > 0) {
        const firstSelected = cierres.find(c => c.id === selectedParaUnir[0]);
        if (firstSelected?.transportistaId !== cierre.transportistaId) {
          alert('Solo puedes unir semanas del mismo transportista.');
          return;
        }
      }
      setSelectedParaUnir([...selectedParaUnir, cierre.id]);
    }
  };

  const handleUnirSemanas = async () => {
    if (selectedParaUnir.length < 2) return;
    if (!confirm(`¿Estás seguro de unir estas ${selectedParaUnir.length} semanas?`)) return;

    setSaving(true);
    const { unirSemanas } = await import('./actions');
    
    // Unir secuencialmente todas al primer cierre seleccionado
    const primario = selectedParaUnir[0];
    let hasError = false;
    for (let i = 1; i < selectedParaUnir.length; i++) {
      const secundario = selectedParaUnir[i];
      const res = await unirSemanas(primario, secundario);
      if (res.error) {
        alert("Error al unir: " + res.error);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      alert("Semanas unidas exitosamente.");
      setMergeMode(false);
      setSelectedParaUnir([]);
    }
    setSaving(false);
  };

  const granTotalSemanas = cierresFiltrados.reduce((acc, c) => acc + c.total, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Filtrar por Transportista</label>
          <select 
            className="form-select" 
            value={filtroTransportista} 
            onChange={(e) => setFiltroTransportista(e.target.value)}
          >
            <option value="">Todos los transportistas</option>
            {transportistasUnicos.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.ruc})</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Total Histórico de Liquidaciones</h3>
          <p style={{ margin: 0, opacity: 0.8, fontSize: '0.8rem', marginTop: '0.25rem' }}>Suma de las semanas mostradas</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => { setMergeMode(!mergeMode); setSelectedParaUnir([]); }}
            className="btn btn-secondary"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
          >
            {mergeMode ? 'Cancelar Unir' : 'Unir Semanas'}
          </button>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>${granTotalSemanas.toFixed(2)}</h2>
        </div>
      </div>

      {mergeMode && selectedParaUnir.length >= 2 && (
        <div style={{ backgroundColor: 'var(--accent)', padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500 }}>{selectedParaUnir.length} semanas seleccionadas para unir.</span>
          <button onClick={handleUnirSemanas} disabled={saving} className="btn btn-primary">
            {saving ? 'Uniendo...' : 'Confirmar Unión'}
          </button>
        </div>
      )}

      {cierresFiltrados.map((cierre) => {
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
                padding: '1.25rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                cursor: mergeMode ? 'default' : 'pointer',
                backgroundColor: expandedId === cierre.id || selectedParaUnir.includes(cierre.id) ? 'var(--muted)' : 'transparent',
                transition: 'background-color 0.2s'
              }}
              onClick={() => !mergeMode && toggleExpand(cierre.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {mergeMode && (
                  <input 
                    type="checkbox" 
                    checked={selectedParaUnir.includes(cierre.id)}
                    onChange={() => toggleMergeSelection(cierre)}
                    style={{ width: '1.25rem', height: '1.25rem' }}
                  />
                )}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {cierre.transportista.name} {cierre.tipo && <span style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 'normal', marginLeft: '0.5rem' }}>({cierre.tipo})</span>}
                  </h3>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Cierre: {new Date(cierre.createdAt).toLocaleDateString('es-ES')} | Guías: {cierre.guias.length}
                  </p>
                </div>
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
                  <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
                    ${cierre.total.toFixed(2)}
                  </p>
                </div>
                <div style={{ color: 'var(--muted-foreground)', fontSize: '1.25rem', marginLeft: '1rem' }}>
                  {expandedId === cierre.id ? '▼' : '▶'}
                </div>
              </div>
            </div>

            {expandedId === cierre.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '1rem', backgroundColor: 'var(--background)' }}>
                {cabezalesArray.map((grupo: any) => {
                  const isGroupEditing = editingGroupId === grupo.cabezal.id;
                  
                  return (
                  <div key={grupo.cabezal.id} style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary)', margin: 0 }}>
                        Cabezal: {grupo.cabezal.placa}
                        <span style={{ marginLeft: '1rem', fontWeight: 'normal', color: 'var(--foreground)' }}>
                          Subtotal: ${grupo.subtotal.toFixed(2)} <span style={{ opacity: 0.7, fontSize: '0.8rem', marginLeft: '0.5rem' }}>| Tickets: ${grupo.totalTickets.toFixed(2)}</span>
                        </span>
                      </h4>
                      <div>
                        {isGroupEditing ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => saveGroupEdit(cierre.id)} disabled={saving} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                              {saving ? 'Guardando...' : 'Guardar Todos'}
                            </button>
                            <button onClick={cancelGroupEditing} disabled={saving} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startGroupEditing(grupo)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Editar Cabezal Completo
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th className={!isGroupEditing ? "hidden md:table-cell" : ""}>Código(s)</th>
                            {isGroupEditing && <th>Vehículo</th>}
                            <th>Destino</th>
                            <th>Valor Base</th>
                            <th>Tickets</th>
                            <th>Adicionales</th>
                            <th>Total Guía</th>
                            <th className={!isGroupEditing ? "hidden md:table-cell" : ""}>Fecha Guía</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.guias.map((guia: any) => {
                            const editState = groupEdits[guia.id];
                            const isEditing = isGroupEditing && editState;
                            
                            const totalAdicionales = guia.adicionales.reduce((acc: number, a: any) => acc + a.valor, 0);
                            const totalGuia = guia.valor_base_cobrado + totalAdicionales;
                            
                            return (
                              <tr key={guia.id} style={isEditing ? { backgroundColor: 'var(--accent)' } : {}}>
                                <td className={!isGroupEditing ? "hidden md:table-cell" : ""}>{guia.codigos_evaluados}</td>
                                
                                {isEditing && (
                                  <td>
                                    <select 
                                      className="form-select" 
                                      value={editState.cabezalId} 
                                      onChange={(e) => handleGroupEditChange(guia.id, 'cabezalId', e.target.value)}
                                      style={{ width: '120px', padding: '0.25rem' }}
                                    >
                                      {cabezales?.filter((c: any) => c.transportistaId === cierre.transportistaId).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.placa}</option>
                                      ))}
                                    </select>
                                  </td>
                                )}

                                <td>{guia.guiaPrecio?.descripcion || guia.cliente_destino}</td>
                                
                                {/* Valor Base */}
                                <td>
                                  {isEditing ? (
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      value={editState.baseValue}
                                      onChange={(e) => handleGroupEditChange(guia.id, 'baseValue', e.target.value)}
                                      style={{ width: '80px' }}
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
                                      value={editState.ticketValue}
                                      onChange={(e) => handleGroupEditChange(guia.id, 'ticketValue', e.target.value)}
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
                                        {editState.adicionales.map((ad: any) => (
                                          <li key={ad.id} style={{ marginBottom: '0.25rem' }}>
                                            <span style={{ display: 'inline-block', width: '80px' }}>{ad.concepto}:</span>
                                            <input 
                                              type="number" 
                                              className="form-input"  
                                              value={ad.valor || 0}
                                              onChange={(e) => handleGroupAdicionalChange(guia.id, ad.id, e.target.value)}
                                              style={{ width: '80px', display: 'inline-block', marginLeft: '0.5rem' }}
                                            />
                                          </li>
                                        ))}
                                      </ul>
                                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <input type="text" placeholder="Concepto" className="form-input" style={{ width: '100px', fontSize: '0.75rem', padding: '0.25rem' }} value={editState.newAdicConcepto} onChange={e => handleGroupEditChange(guia.id, 'newAdicConcepto', e.target.value)} />
                                        <input type="number" placeholder="Valor" className="form-input" style={{ width: '70px', fontSize: '0.75rem', padding: '0.25rem' }} value={editState.newAdicValor} onChange={e => handleGroupEditChange(guia.id, 'newAdicValor', e.target.value)} />
                                        <button className="btn btn-secondary" onClick={() => handleAddNewAdicionalGroup(guia.id)} type="button" style={{ padding: '0.25rem 0.5rem' }}>+</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                                      {guia.adicionales.map((ad: any) => (
                                        <li key={ad.id}>{ad.concepto}: ${ad.valor.toFixed(2)}</li>
                                      ))}
                                    </ul>
                                  )}
                                </td>

                                {/* Total */}
                                <td style={{ fontWeight: 500 }}>
                                  ${totalGuia.toFixed(2)}
                                </td>
                                
                                {/* Fecha */}
                                <td className={!isGroupEditing ? "hidden md:table-cell" : ""}>{new Date(guia.fecha_guia).toLocaleDateString('es-ES')}</td>

                                {/* Acciones */}
                                <td style={{ textAlign: 'right' }}>
                                  {!isEditing && (
                                    <button 
                                      onClick={() => handleDelete(guia.id, cierre.id)}
                                      disabled={deletingId === guia.id}
                                      style={{ background: 'none', border: 'none', color: 'var(--destructive)', cursor: 'pointer', fontSize: '1.25rem', opacity: 0.7 }}
                                      title="Eliminar guía de semana"
                                    >
                                      🗑
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
