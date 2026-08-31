'use client';

import { useState } from 'react';
import { crearTransportista, crearCabezal, eliminarCabezal, asignarUsuarioATransportista } from './actions';
import styles from './transportista.module.css';

export default function TransportistaClient({ 
  transportistas, 
  usuarios = [], 
  isAdmin = false 
}: { 
  transportistas: any[]; 
  usuarios?: any[]; 
  isAdmin?: boolean; 
}) {
  const [error, setError] = useState<string | null>(null);
  
  // Transportista Form
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');

  // Cabezal Form
  const [placa, setPlaca] = useState('');
  const [selectedTransportistaId, setSelectedTransportistaId] = useState('');
  const [showCabezalModal, setShowCabezalModal] = useState(false);

  // User Assignment Form
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const handleCrearTransportista = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !ruc) return;
    setError(null);
    const res = await crearTransportista({ name: nombre, ruc });
    if (res.error) {
      setError(res.error);
    } else {
      setNombre('');
      setRuc('');
    }
  };

  const openCabezalModal = (transportistaId: string) => {
    setSelectedTransportistaId(transportistaId);
    setPlaca('');
    setShowCabezalModal(true);
  };

  const handleCrearCabezal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !selectedTransportistaId) return;
    setError(null);
    const res = await crearCabezal({ placa: placa.toUpperCase(), transportistaId: selectedTransportistaId });
    if (res.error) {
      setError(res.error);
    } else {
      setShowCabezalModal(false);
      setPlaca('');
    }
  };

  const handleEliminarCabezal = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cabezal?')) {
      const res = await eliminarCabezal(id);
      if (res.error) alert(res.error);
    }
  };

  const openUserModal = (transportistaId: string) => {
    setSelectedTransportistaId(transportistaId);
    setSelectedUserId('');
    setShowUserModal(true);
  };

  const handleAsignarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedTransportistaId) return;
    setError(null);
    const res = await asignarUsuarioATransportista(selectedTransportistaId, selectedUserId);
    if (res.error) {
      setError(res.error);
    } else {
      setShowUserModal(false);
      setSelectedUserId('');
    }
  };

  const handleDescargarLiquidacion = async (liquidacionId: string, fecha: string) => {
    const { getLiquidacionDetalle } = await import('./actions');
    const res = await getLiquidacionDetalle(liquidacionId);
    
    if (res.error || !res.reporte) {
      alert("Error al obtener la liquidación: " + res.error);
      return;
    }

    const { reporte } = res;
    
    // Función de agrupación similar a la de PrefacturaClient
    const agruparGuias = (guias: any[]) => {
      const grupos: Record<string, any> = {};
      guias.forEach(g => {
        const totalAdicionales = g.adicionales.reduce((acc: number, a: any) => acc + a.valor, 0);
        const valorTotal = g.valor_base_cobrado + totalAdicionales;
        const key = `${g.cabezal.placa}-${g.guiaPrecio.codigo}-${valorTotal}`;
        if (!grupos[key]) {
          grupos[key] = {
            placa: g.cabezal.placa,
            codigo: g.guiaPrecio.codigo,
            descripcion: g.guiaPrecio.descripcion,
            tipo: g.guiaPrecio.tipo,
            valorUnitario: valorTotal,
            cantidad: 0,
            total: 0
          };
        }
        grupos[key].cantidad += 1;
        grupos[key].total += valorTotal;
      });
      return Object.values(grupos);
    };

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TIPO,PLACA CABEZAL,CODIGO,DESTINO,TIPO GUIA,CANT. VIAJES,VALOR UNIT.,TOTAL\n";

    const addRows = (tipo: string, guiasAgrupadas: any[]) => {
      guiasAgrupadas.forEach((row: any) => {
        csvContent += `${tipo},${row.placa},${row.codigo},${row.descripcion},${row.tipo},${row.cantidad},${row.valorUnitario.toFixed(2)},${row.total.toFixed(2)}\n`;
      });
    };

    addRows("NORMAL", agruparGuias(reporte.normales));
    addRows("ADICIONAL", agruparGuias(reporte.adicionales));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Liquidacion_${fecha}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.alertError}>{error}</div>}

      <div className={styles.formContainer}>
        <h3>Añadir Nuevo Transportista</h3>
        <form onSubmit={handleCrearTransportista} className={styles.inlineForm}>
          <input 
            type="text" 
            placeholder="Nombre o Razón Social" 
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="RUC" 
            value={ruc}
            onChange={e => setRuc(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">Registrar</button>
        </form>
      </div>

      <div className={styles.grid}>
        {transportistas.map((t) => (
          <div key={t.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4>{t.name}</h4>
                  <span className={styles.ruc}>RUC: {t.ruc}</span>
                </div>
                {isAdmin && (
                  <button 
                    type="button" 
                    className={styles.addBtn}
                    onClick={() => openUserModal(t.id)}
                  >
                    + Asignar Usuario
                  </button>
                )}
              </div>
              
              {t.users && t.users.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Usuarios asignados: </span>
                  <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {t.users.map((u: any) => (
                      <span key={u.id} className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.cabezalesSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h5>Cabezales Asignados</h5>
                <button 
                  type="button" 
                  className={styles.addBtn}
                  onClick={() => openCabezalModal(t.id)}
                >
                  + Añadir Placa
                </button>
              </div>

              {t.cabezales.length === 0 ? (
                <p className={styles.empty}>No hay cabezales registrados.</p>
              ) : (
                <ul className={styles.placasList}>
                  {t.cabezales.map((c: any) => (
                    <li key={c.id}>
                      <span className={styles.placaBadge}>{c.placa}</span>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleEliminarCabezal(c.id)}
                      >
                        x
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.cabezalesSection} style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
              <h5>Historial de Liquidaciones</h5>
              {!t.liquidaciones || t.liquidaciones.length === 0 ? (
                <p className={styles.empty}>No hay liquidaciones registradas.</p>
              ) : (
                <ul className={styles.placasList} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {t.liquidaciones.map((liq: any) => {
                    const formatFecha = new Date(liq.fecha_inicio).toISOString().split('T')[0];
                    return (
                      <li key={liq.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#f8fafc', borderRadius: '5px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {new Date(liq.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(liq.fecha_fin).toLocaleDateString('es-ES')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Generada: {new Date(liq.createdAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <strong style={{ color: '#16a34a' }}>${liq.total_pagado.toFixed(2)}</strong>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            onClick={() => handleDescargarLiquidacion(liq.id, formatFecha)}
                          >
                            Descargar Reporte (CSV)
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCabezalModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Asignar Cabezal</h3>
            <p>Ingresa la placa del cabezal.</p>
            <form onSubmit={handleCrearCabezal} className={styles.modalForm}>
              <input 
                type="text" 
                placeholder="Ej. GBA-1234"
                value={placa}
                onChange={e => setPlaca(e.target.value)}
                required
              />
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCabezalModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Añadir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Asignar Usuario</h3>
            <p>Selecciona el usuario que podrá gestionar este transportista.</p>
            <form onSubmit={handleAsignarUsuario} className={styles.modalForm}>
              <select 
                className="form-select" 
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">Selecciona un usuario</option>
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Asignar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
