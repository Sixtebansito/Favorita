'use client';

import { useState, useEffect } from 'react';
import { lookupPreciosMultiple, registrarGuia, getGuiasDeLaSemana, cerrarSemanaGlobal, eliminarGuiaActiva, actualizarValorGuiaActiva, addPrecioToTarifario } from './actions';
import styles from './registro.module.css';

export default function RegistroGuiaClient({ cabezales }: { cabezales: any[] }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cabezalId, setCabezalId] = useState('');
  const [clienteDestino, setClienteDestino] = useState('FAVORITA');
  
  // Array de códigos
  const [codigos, setCodigos] = useState<string[]>([]);
  const [nuevoCodigo, setNuevoCodigo] = useState('');

  const [adicionales, setAdicionales] = useState<{ concepto: string, valor: number }[]>([]);
  const [nuevoConcepto, setNuevoConcepto] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');

  const [transportistaId, setTransportistaId] = useState('');
  const [precioPreview, setPrecioPreview] = useState<any>(null);
  const [valorTicket, setValorTicket] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [missingTarifarioId, setMissingTarifarioId] = useState<string>('');
  const [missingTarifarioNombre, setMissingTarifarioNombre] = useState<string>('');
  
  // Estados para añadir nuevo código
  const [showAddCodigoModal, setShowAddCodigoModal] = useState(false);
  const [newPrecioCodigo, setNewPrecioCodigo] = useState('');
  const [newPrecioTipo, setNewPrecioTipo] = useState('SECO');
  const [newPrecioDescripcion, setNewPrecioDescripcion] = useState('');
  const [newPrecioValor, setNewPrecioValor] = useState('');
  const [addingPrecio, setAddingPrecio] = useState(false);

  const [success, setSuccess] = useState<boolean>(false);

  // Derivar transportistas únicos de la lista de cabezales
  const transportistasUnicos = Array.from(new Set(cabezales.map(c => c.transportistaId))).map(
    id => cabezales.find(c => c.transportistaId === id)!.transportista
  );

  // Auto-seleccionar si solo hay 1
  useEffect(() => {
    if (transportistasUnicos.length === 1 && !transportistaId) {
      setTransportistaId(transportistasUnicos[0].id);
    }
  }, [transportistasUnicos, transportistaId]);

  const cabezalesFiltrados = cabezales.filter(c => c.transportistaId === transportistaId);

  useEffect(() => {
    if (cabezalesFiltrados.length === 1 && !cabezalId) {
      setCabezalId(cabezalesFiltrados[0].id);
    } else if (cabezalesFiltrados.length === 0 || !cabezalesFiltrados.find(c => c.id === cabezalId)) {
      setCabezalId('');
    }
  }, [cabezalesFiltrados, cabezalId]);

  const [guiasSemana, setGuiasSemana] = useState<any[]>([]);
  const [cargandoGuias, setCargandoGuias] = useState(true);

  // Estados para la edición en línea de la semana activa
  const [editingActivaId, setEditingActivaId] = useState<string | null>(null);
  const [editBaseValueActiva, setEditBaseValueActiva] = useState<number>(0);
  const [editTicketActiva, setEditTicketActiva] = useState<number>(0);
  const [editAdicionalesActiva, setEditAdicionalesActiva] = useState<{id: string, concepto?: string, valor: number}[]>([]);
  const [newAdicConceptoActiva, setNewAdicConceptoActiva] = useState('');
  const [newAdicValorActiva, setNewAdicValorActiva] = useState('');
  const [savingActiva, setSavingActiva] = useState(false);

  const fetchGuiasSemana = async () => {
    setCargandoGuias(true);
    const data = await getGuiasDeLaSemana();
    setGuiasSemana(data);
    setCargandoGuias(false);
  };

  useEffect(() => {
    fetchGuiasSemana();
  }, []);

  const handleAddCodigo = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!nuevoCodigo.trim()) return;
    const code = nuevoCodigo.trim().toUpperCase();
    if (!codigos.includes(code)) {
      setCodigos([...codigos, code]);
    }
    setNuevoCodigo('');
    setPrecioPreview(null);
  };

  const handleRemoveCodigo = (index: number) => {
    setCodigos(codigos.filter((_, i) => i !== index));
    setPrecioPreview(null);
  };

  const handleBuscarPrecio = async () => {
    setError(null);
    setPrecioPreview(null);
    
    // Si hay un código en el input que no se ha añadido, lo añadimos primero
    let codigosEvaluar = [...codigos];
    if (nuevoCodigo.trim()) {
      const code = nuevoCodigo.trim().toUpperCase();
      if (!codigosEvaluar.includes(code)) {
        codigosEvaluar.push(code);
        setCodigos(codigosEvaluar);
        setNuevoCodigo('');
      }
    }

    if (codigosEvaluar.length === 0) {
      setError('Debes ingresar al menos un código de guía.');
      return;
    }
    if (!fecha) return;

    const res = await lookupPreciosMultiple(codigosEvaluar, fecha);
    if (res.error) {
      setError(res.error);
      setIsNotFound(res.notFound || false);
      if (res.notFound) {
        setMissingTarifarioId(res.tarifarioId);
        setMissingTarifarioNombre(res.tarifarioNombre);
        setNewPrecioCodigo(codigosEvaluar[0] || '');
      }
    } else {
      setPrecioPreview(res);
      setIsNotFound(false);
      setMissingTarifarioId('');
      setMissingTarifarioNombre('');
      
      // Calculate Ticket Value
      let ticket = 0;
      if (res.precio) {
        const baseVal = res.precio.valor;
        if (baseVal < 120) {
          const dest = res.precio.descripcion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (['jardin', 'multicentro', 'colon', 'granados', 'america'].some(k => dest.includes(k))) {
            ticket = 8;
          } else if (dest.includes('plaza valle')) {
            ticket = 4;
          } else if (baseVal < 50) {
            ticket = 2;
          } else {
            ticket = 4;
          }
        }
      }
      setValorTicket(ticket);
    }
  };

  const handleCreatePrecio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrecioCodigo || !newPrecioDescripcion || !newPrecioValor) return;
    setAddingPrecio(true);
    const res = await addPrecioToTarifario(missingTarifarioId, {
      codigo: newPrecioCodigo.toUpperCase(),
      tipo: newPrecioTipo,
      descripcion: newPrecioDescripcion.toUpperCase(),
      valor: parseFloat(newPrecioValor)
    });
    setAddingPrecio(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      setShowAddCodigoModal(false);
      alert('Código agregado exitosamente al tarifario.');
      handleBuscarPrecio(); // re-evaluar automáticamente
    }
  };

  const handleAddAdicional = () => {
    if (!nuevoConcepto || !nuevoValor) return;
    setAdicionales([...adicionales, { concepto: nuevoConcepto, valor: parseFloat(nuevoValor) }]);
    setNuevoConcepto('');
    setNuevoValor('');
  };

  const handleRemoveAdicional = (index: number) => {
    setAdicionales(adicionales.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabezalId || codigos.length === 0 || !fecha || !precioPreview) {
      setError('Por favor completa los campos y busca el precio antes de registrar.');
      return;
    }
    
    setError(null);
    setSuccess(false);

    const res = await registrarGuia({
      cabezalId,
      fecha_guia: fecha,
      codigos: codigos,
      cliente_destino: clienteDestino,
      adicionales,
      valor_ticket: valorTicket
    });

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setCodigos([]);
      setNuevoCodigo('');
      setPrecioPreview(null);
      setValorTicket(0);
      setAdicionales([]);
      fetchGuiasSemana(); // Refrescar tabla
    }
  };

  const handleCerrarSemana = async () => {
    if (guiasSemana.length === 0) return;
    const confirm = window.confirm('¿Estás seguro de guardar los valores de la semana? Esto cuadrará las guías activas agrupándolas por transportista.');
    if (!confirm) return;

    const res = await cerrarSemanaGlobal();
    if (res.error) {
      alert(res.error);
    } else {
      alert('Valores de la semana guardados con éxito.');
      fetchGuiasSemana();
    }
  };

  const handleEliminarActiva = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta guía?')) return;
    const res = await eliminarGuiaActiva(id);
    if (res.error) {
      alert(res.error);
    } else {
      fetchGuiasSemana();
    }
  };

  const startEditingActiva = (guia: any) => {
    setEditingActivaId(guia.id);
    setEditBaseValueActiva(guia.valor_base_cobrado);
    setEditTicketActiva(guia.valor_ticket || 0);
    setEditAdicionalesActiva(guia.adicionales.map((a: any) => ({ id: a.id, concepto: a.concepto, valor: a.valor })));
    setNewAdicConceptoActiva('');
    setNewAdicValorActiva('');
  };

  const handleAdicionalChangeActiva = (id: string, newValue: string) => {
    setEditAdicionalesActiva(prev => prev.map(a => a.id === id ? { ...a, valor: parseFloat(newValue) || 0 } : a));
  };

  const handleAddNewAdicionalActiva = () => {
    if (!newAdicConceptoActiva || !newAdicValorActiva) return;
    setEditAdicionalesActiva([...editAdicionalesActiva, { id: `new_${Date.now()}`, concepto: newAdicConceptoActiva, valor: parseFloat(newAdicValorActiva) }]);
    setNewAdicConceptoActiva('');
    setNewAdicValorActiva('');
  };

  const saveEditActiva = async () => {
    if (!editingActivaId) return;
    setSavingActiva(true);
    const res = await actualizarValorGuiaActiva(editingActivaId, editBaseValueActiva, editTicketActiva, editAdicionalesActiva);
    if (res.error) {
      alert("Error al actualizar: " + res.error);
    } else {
      setEditingActivaId(null);
      fetchGuiasSemana();
    }
    setSavingActiva(false);
  };

  const guiasSemanaVisibles = transportistaId 
    ? guiasSemana.filter(g => g.cabezal.transportistaId === transportistaId)
    : guiasSemana;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          {error && (
            <div className={styles.alertError}>
              {error}
              {isNotFound && missingTarifarioId && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button type="button" className="btn btn-primary" onClick={() => setShowAddCodigoModal(true)} style={{ width: '100%', padding: '0.5rem' }}>
                    + Añadir Código a Tarifario ({missingTarifarioNombre})
                  </button>
                </div>
              )}
            </div>
          )}
          {success && <div className={styles.alertSuccess}>¡Guía registrada con éxito!</div>}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Compañía</label>
              <select className="form-select" value={transportistaId} onChange={(e) => setTransportistaId(e.target.value)} required>
                <option value="">Selecciona una compañía</option>
                {transportistasUnicos.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Cabezal (Placa)</label>
              <select className="form-select" value={cabezalId} onChange={(e) => setCabezalId(e.target.value)} required disabled={!transportistaId}>
                <option value="">Selecciona un cabezal</option>
                {cabezalesFiltrados.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.placa}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Cliente Destino</label>
              <select className="form-select" value={clienteDestino} onChange={(e) => setClienteDestino(e.target.value)} required>
                <option value="FAVORITA">FAVORITA (Guía Normal)</option>
                <option value="POFASA">POFASA</option>
                <option value="AGROPESA">AGROPESA</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Fecha de la Guía</label>
              <input 
                type="date" 
                className="form-input"
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className={styles.adicionalesSection}>
            <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Códigos de Guía (Ingresa al menos 1, o varios para evaluarlos)</h4>
            <div className={styles.addAdicional}>
              <input 
                type="text" 
                className="form-input"
                value={nuevoCodigo} 
                onChange={(e) => setNuevoCodigo(e.target.value.toUpperCase())} 
                placeholder="Ej. 343 o 343S" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCodigo();
                    setTimeout(() => handleBuscarPrecio(), 50); // Small timeout to allow state update
                  }
                }}
              />
              <button type="button" onClick={handleAddCodigo} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                <span className="desktop-only">Añadir Código</span>
                <span className="mobile-only">+</span>
              </button>
            </div>
            
            {codigos.length > 0 && (
              <ul className={styles.adicionalesList} style={{ marginBottom: '15px', marginTop: '1rem' }}>
                {codigos.map((cod, i) => (
                  <li key={i}>
                    <span style={{ fontWeight: '600', fontSize: '1rem', fontFamily: 'monospace' }}>{cod}</span>
                    <button type="button" onClick={() => handleRemoveCodigo(i)}>x</button>
                  </li>
                ))}
              </ul>
            )}

            <button type="button" onClick={handleBuscarPrecio} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
              Comparar y Buscar Valor
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginTop: '1rem', alignItems: 'start' }}>
            {precioPreview && (
              <div className={styles.previewBox} style={{ margin: 0, height: '100%' }}>
                <h4>Resultado del Análisis</h4>
                {precioPreview.todosLosPrecios.length > 1 && (
                  <p style={{ marginBottom: '15px', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                    Se compararon {precioPreview.todosLosPrecios.length} códigos válidos. 
                    El sistema ha seleccionado el código <strong>{precioPreview.precio.codigo}</strong> porque tiene el mayor valor (${precioPreview.precio.valor.toFixed(2)}).
                  </p>
                )}
                <div style={{ backgroundColor: 'var(--background)', padding: '15px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                  <p><strong>Código Elegido:</strong> {precioPreview.precio.codigo}</p>
                  <p><strong>Destino:</strong> {precioPreview.precio.descripcion}</p>
                  <p><strong>Tipo:</strong> {precioPreview.precio.tipo}</p>
                  <p><strong>Tarifario Base:</strong> {precioPreview.tarifario.nombre}</p>
                  <div className={styles.priceTag}>
                    Valor Base: ${precioPreview.precio.valor.toFixed(2)}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>TICKETS:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--muted-foreground)' }}>$</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-input" 
                        style={{ width: '100px', margin: 0 }}
                        value={valorTicket} 
                        onChange={(e) => setValorTicket(parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!precioPreview && <div />} {/* Empty placeholder if no preview */}

            <div className={styles.adicionalesSection} style={{ margin: 0, height: '100%' }}>
              <h4 style={{ marginBottom: '1rem', fontWeight: 600 }}>Costos Adicionales (Opcional)</h4>
              <div className={styles.addAdicional}>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Concepto" 
                  value={nuevoConcepto}
                  onChange={e => setNuevoConcepto(e.target.value)}
                />
                <input 
                  type="number" 
                  className="form-input"
                  step="0.01" 
                  placeholder="Valor ($)" 
                  value={nuevoValor}
                  onChange={e => setNuevoValor(e.target.value)}
                />
                <button type="button" onClick={handleAddAdicional} className="btn btn-secondary" style={{ padding: '0.5rem' }}>Añadir</button>
              </div>
              
              {adicionales.length > 0 && (
                <ul className={styles.adicionalesList} style={{ marginTop: '1rem' }}>
                  {adicionales.map((ad, i) => (
                    <li key={i}>
                      <span>{ad.concepto}</span>
                      <strong>${ad.valor.toFixed(2)}</strong>
                      <button type="button" onClick={() => handleRemoveAdicional(i)}>x</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={styles.totalSection}>
            <h3>Total Guías: ${ ( (precioPreview?.precio?.valor || 0) + adicionales.reduce((acc, a) => acc + a.valor, 0) ).toFixed(2) }</h3>
            <h3 style={{ color: 'var(--muted-foreground)' }}>Total Tickets: ${valorTicket.toFixed(2)}</h3>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1rem' }}>
            Registrar Guía
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>SEMANA: Guías Registradas (Sin Cuadrar)</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Guías activas ingresadas esta semana que aún no han sido agrupadas.</p>
          </div>
          <button onClick={handleCerrarSemana} disabled={guiasSemana.length === 0} className="btn btn-primary">
            Guardar valores de la semana
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {cargandoGuias ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>Cargando guías...</div>
          ) : guiasSemanaVisibles.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay guías activas registradas para la selección actual.</div>
          ) : (
            <>
              {Object.entries(guiasSemanaVisibles.reduce((acc, guia) => {
                const placa = guia.cabezal.placa;
                if (!acc[placa]) acc[placa] = [];
                acc[placa].push(guia);
                return acc;
              }, {} as Record<string, any[]>)).map(([placa, guiasCabezal]: [string, any]) => (
                <div key={placa} className="data-table-container" style={{ overflow: 'hidden' }}>
                  <div style={{ 
                    padding: '1.25rem 1.5rem', 
                    backgroundColor: 'var(--secondary)', 
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--foreground)', margin: 0 }}>
                      <span style={{ display: 'inline-block', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', marginRight: '0.75rem' }}>
                        {placa}
                      </span>
                      <span style={{ color: 'var(--muted-foreground)', fontWeight: 'normal', fontSize: '0.875rem' }}>
                        {guiasCabezal[0].cabezal.transportista.name}
                      </span>
                    </h4>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>
                      {guiasCabezal.length} {guiasCabezal.length === 1 ? 'Guía' : 'Guías'}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ width: '100%', border: 'none' }}>
                      <thead>
                        <tr>
                          <th>Código(s)</th>
                          <th>Destino</th>
                          <th>Valor Base</th>
                          <th>Adicionales</th>
                          <th>Total</th>
                          <th>Tickets</th>
                          <th>Fecha</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guiasCabezal.map((guia: any) => {
                          const isEditing = editingActivaId === guia.id;
                          const totalAdicional = guia.adicionales.reduce((acc: number, a: any) => acc + a.valor, 0);
                          const granTotal = guia.valor_base_cobrado + totalAdicional;
                          return (
                            <tr key={guia.id} style={isEditing ? { backgroundColor: 'var(--accent)' } : {}}>
                              <td>
                                <span className="badge badge-secondary">{guia.codigos_evaluados}</span>
                              </td>
                              <td>{guia.guiaPrecio?.descripcion || guia.cliente_destino}</td>
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="form-input" 
                                    value={editBaseValueActiva} 
                                    onChange={(e) => setEditBaseValueActiva(parseFloat(e.target.value) || 0)}
                                    style={{ width: '100px' }}
                                  />
                                ) : (
                                  `$${guia.valor_base_cobrado.toFixed(2)}`
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                                      {editAdicionalesActiva.map((ad: any) => (
                                        <li key={ad.id} style={{ marginBottom: '0.5rem' }}>
                                          {ad.concepto}: 
                                          <input 
                                            type="number" 
                                            className="form-input" 
                                            value={ad.valor || 0}
                                            onChange={(e) => handleAdicionalChangeActiva(ad.id, e.target.value)}
                                            style={{ width: '80px', display: 'inline-block', marginLeft: '0.5rem' }}
                                          />
                                        </li>
                                      ))}
                                    </ul>
                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem' }}>
                                      <input type="text" placeholder="Concepto" className="form-input" style={{ width: '100px', fontSize: '0.75rem', padding: '0.25rem' }} value={newAdicConceptoActiva} onChange={e => setNewAdicConceptoActiva(e.target.value)} />
                                      <input type="number" placeholder="Valor" className="form-input" style={{ width: '70px', fontSize: '0.75rem', padding: '0.25rem' }} value={newAdicValorActiva} onChange={e => setNewAdicValorActiva(e.target.value)} />
                                      <button className="btn btn-secondary" onClick={handleAddNewAdicionalActiva} type="button" style={{ padding: '0.25rem 0.5rem' }}>+</button>
                                    </div>
                                  </div>
                                ) : (
                                  guia.adicionales.length > 0 ? (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                                      {guia.adicionales.map((ad: any) => (
                                        <li key={ad.id}>
                                          {ad.concepto}: <strong style={{ color: 'var(--foreground)' }}>${ad.valor.toFixed(2)}</strong>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <span style={{ color: 'var(--muted-foreground)' }}>-</span>
                                  )
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <span style={{ color: 'var(--muted-foreground)' }}>Auto...</span>
                                ) : (
                                  <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>${granTotal.toFixed(2)}</strong>
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    className="form-input" 
                                    value={editTicketActiva} 
                                    onChange={(e) => setEditTicketActiva(parseFloat(e.target.value) || 0)}
                                    style={{ width: '80px' }}
                                  />
                                ) : (
                                  `$${(guia.valor_ticket || 0).toFixed(2)}`
                                )}
                              </td>
                              
                              {/* Fecha */}
                              <td>{new Date(guia.fecha_guia).toLocaleDateString('es-ES')}</td>

                              <td style={{ textAlign: 'right' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-primary" onClick={saveEditActiva} disabled={savingActiva}>
                                      {savingActiva ? '...' : 'Guardar'}
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setEditingActivaId(null)} disabled={savingActiva}>
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-secondary" onClick={() => startEditingActiva(guia)}>
                                      Editar
                                    </button>
                                    <button className="btn btn-danger" onClick={() => handleEliminarActiva(guia.id)}>
                                      Eliminar
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
                  <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--muted)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem' }}>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginRight: '0.5rem' }}>Total Guías:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--foreground)' }}>
                      ${guiasCabezal.reduce((sum: number, g: any) => sum + g.valor_base_cobrado + g.adicionales.reduce((a: any, b: any) => a + b.valor, 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted-foreground)', marginRight: '0.5rem' }}>Total Tickets:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>
                      ${guiasCabezal.reduce((sum: number, g: any) => sum + (g.valor_ticket || 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="card" style={{ padding: '1.5rem', marginTop: '1rem', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontWeight: 700 }}>TOTAL GLOBAL (SELECCIÓN)</h3>
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>TOTAL GUÍAS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      ${guiasSemanaVisibles.reduce((sum, g) => sum + g.valor_base_cobrado + g.adicionales.reduce((a: any, b: any) => a + b.valor, 0), 0).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>TOTAL TICKETS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      ${guiasSemanaVisibles.reduce((sum, g) => sum + (g.valor_ticket || 0), 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showAddCodigoModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(2, 8, 23, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--background)', padding: '1.5rem', borderRadius: 'var(--radius)',
            width: '100%', maxWidth: '400px', border: '1px solid var(--border)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--foreground)', fontSize: '1.25rem', fontWeight: 600 }}>Añadir Código</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>
              Añadiendo al tarifario: <strong>{missingTarifarioNombre}</strong>
            </p>
            <form onSubmit={handleCreatePrecio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Código (Ej. 123 o 123S)</label>
                <input type="text" className="form-input" value={newPrecioCodigo} onChange={e => setNewPrecioCodigo(e.target.value.toUpperCase())} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tipo (Seco o Frío)</label>
                <select className="form-input" value={newPrecioTipo} onChange={e => setNewPrecioTipo(e.target.value)} required>
                  <option value="SECO">SECO</option>
                  <option value="FRIO">FRÍO</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Destino / Descripción</label>
                <input type="text" className="form-input" value={newPrecioDescripcion} onChange={e => setNewPrecioDescripcion(e.target.value.toUpperCase())} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Valor a Pagar ($)</label>
                <input type="number" step="0.01" className="form-input" value={newPrecioValor} onChange={e => setNewPrecioValor(e.target.value)} required />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCodigoModal(false)} disabled={addingPrecio}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={addingPrecio}>
                  {addingPrecio ? 'Guardando...' : 'Añadir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
