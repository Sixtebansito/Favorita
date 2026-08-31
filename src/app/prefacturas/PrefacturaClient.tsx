'use client';

import { useState } from 'react';
import { generarPrefactura, liquidarValores } from './actions';
import styles from './prefactura.module.css';

export default function PrefacturaClient({ transportistas }: { transportistas: any[] }) {
  const [transportistaId, setTransportistaId] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [reporte, setReporte] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [liquidando, setLiquidando] = useState(false);

  const handleGenerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transportistaId || !fechaInicio || !fechaFin) return;
    
    setLoading(true);
    const data = await generarPrefactura(transportistaId, fechaInicio, fechaFin);
    setReporte(data);
    setLoading(false);
  };

  const agruparGuias = (guias: any[]) => {
    const grupos: Record<string, any> = {};
    guias.forEach(g => {
      const totalAdicionales = g.adicionales.reduce((acc: number, a: any) => acc + a.valor, 0);
      const valorTotal = g.valor_base_cobrado + totalAdicionales;
      
      const key = `${g.guiaPrecio.codigo}-${valorTotal}`;
      if (!grupos[key]) {
        grupos[key] = {
          codigo: g.guiaPrecio.codigo,
          descripcion: g.guiaPrecio.descripcion,
          valorUnitario: valorTotal,
          cantidad: 0,
          total: 0
        };
      }
      grupos[key].cantidad += 1;
      grupos[key].total += valorTotal;
    });
    return Object.values(grupos).sort((a: any, b: any) => b.valorUnitario - a.valorUnitario);
  };

  const exportarAExcel = (reporteParaExportar: any = reporte, fileName: string = `Prefactura_${new Date().getTime()}.csv`) => {
    if (!reporteParaExportar) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TIPO,CODIGO,DESTINO,VALOR,CANTIDAD,TOTAL\n";

    const addRows = (tipo: string, guiasAgrupadas: any[]) => {
      guiasAgrupadas.forEach((row: any) => {
        csvContent += `${tipo},${row.codigo},${row.descripcion},${row.valorUnitario.toFixed(2)},${row.cantidad},${row.total.toFixed(2)}\n`;
      });
      const subtotal = guiasAgrupadas.reduce((acc, row) => acc + row.total, 0);
      csvContent += `${tipo} TOTAL,,,,,${subtotal.toFixed(2)}\n`;
    };

    addRows("NORMAL", agruparGuias(reporteParaExportar.normales));
    addRows("ADICIONAL", agruparGuias(reporteParaExportar.adicionales));

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLiquidar = async () => {
    if (!reporte || reporte.guiasOriginales.length === 0) return;
    
    const confirmacion = window.confirm("¿Estás seguro de liquidar? Los valores de semanas se limpiarán (pasarán a estado LIQUIDADA) y se generará el registro en el historial del transportista.");
    
    if (!confirmacion) return;

    setLiquidando(true);
    
    const guiasIds = reporte.guiasOriginales.map((g: any) => g.id);
    
    // Calcular el total
    const totalNormales = reporte.normales.reduce((acc: number, g: any) => {
      const adic = g.adicionales.reduce((s: number, a: any) => s + a.valor, 0);
      return acc + g.valor_base_cobrado + adic;
    }, 0);
    const totalAdicionales = reporte.adicionales.reduce((acc: number, g: any) => {
      const adic = g.adicionales.reduce((s: number, a: any) => s + a.valor, 0);
      return acc + g.valor_base_cobrado + adic;
    }, 0);
    const totalPagado = totalNormales + totalAdicionales;
    const totalTickets = reporte.guiasOriginales.reduce((acc: number, g: any) => acc + (g.valor_ticket || 0), 0);

    const res = await liquidarValores(transportistaId, fechaInicio, fechaFin, totalPagado, totalTickets, guiasIds);
    
    if (res.error) {
      alert("Error al liquidar: " + res.error);
    } else {
      alert("Liquidación generada con éxito. Descargando prefactura...");
      exportarAExcel(reporte, `Prefactura_${transportistaId}_${fechaInicio}_${fechaFin}.csv`);
      setReporte(null); // Limpiamos la pantalla
    }
    
    setLiquidando(false);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleGenerar} className={styles.filters}>
        <div className={styles.formGroup}>
          <label>Transportista</label>
          <select value={transportistaId} onChange={e => setTransportistaId(e.target.value)} required>
            <option value="">Seleccione un transportista</option>
            {transportistas.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.ruc})</option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label>Fecha Inicio</label>
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required />
        </div>

        <div className={styles.formGroup}>
          <label>Fecha Fin</label>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} required />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </form>

      {reporte && (() => {
        const totalNormales = reporte.normales.reduce((acc: number, g: any) => acc + g.valor_base_cobrado + g.adicionales.reduce((s: number, a: any) => s + a.valor, 0), 0);
        const totalAdicionales = reporte.adicionales.reduce((acc: number, g: any) => acc + g.valor_base_cobrado + g.adicionales.reduce((s: number, a: any) => s + a.valor, 0), 0);
        const totalGeneral = totalNormales + totalAdicionales;
        const totalTickets = reporte.guiasOriginales.reduce((acc: number, g: any) => acc + (g.valor_ticket || 0), 0);

        return (
          <div className={styles.reportContainer}>
            <div className={styles.reportHeader}>
              <h2>Resultados de Prefactura</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => exportarAExcel()}>Exportar a Excel</button>
                {reporte.guiasOriginales.length > 0 && (
                  <button 
                    className="btn btn-danger" 
                    onClick={handleLiquidar}
                    disabled={liquidando}
                  >
                    {liquidando ? 'Liquidando...' : 'Sellar / Liquidar'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Total a Pagar (Gran Total Guías)</h3>
                <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem', marginTop: '0.25rem' }}>Suma de facturas normales y adicionales</p>
              </div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8, fontWeight: 600 }}>TICKETS</div>
                  <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 700 }}>${totalTickets.toFixed(2)}</h2>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', opacity: 0.8, fontWeight: 600 }}>GUÍAS</div>
                  <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700 }}>${totalGeneral.toFixed(2)}</h2>
                </div>
              </div>
            </div>

          <div className={styles.tabs}>
            <h3>Prefactura Principal (Normales)</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Destino</th>
                  <th>Valor</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {agruparGuias(reporte.normales).map((row: any, i: number) => (
                  <tr key={i}>
                    <td>{row.codigo}</td>
                    <td>{row.descripcion}</td>
                    <td>${row.valorUnitario.toFixed(2)}</td>
                    <td>{row.cantidad}</td>
                    <td><strong>${row.total.toFixed(2)}</strong></td>
                  </tr>
                ))}
                {reporte.normales.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center'}}>No hay guías normales en este periodo.</td></tr>
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total de prefactura:</td>
                    <td><strong>${reporte.normales.reduce((acc: number, g: any) => acc + g.valor_base_cobrado + g.adicionales.reduce((s: number, a: any) => s + a.valor, 0), 0).toFixed(2)}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tabs} style={{ marginTop: '40px' }}>
            <h3 style={{ color: '#f87171' }}>Prefactura Adicional (POFASA / AGROPESA)</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Destino</th>
                  <th>Valor</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {agruparGuias(reporte.adicionales).map((row: any, i: number) => (
                  <tr key={i}>
                    <td>{row.codigo}</td>
                    <td>{row.descripcion}</td>
                    <td>${row.valorUnitario.toFixed(2)}</td>
                    <td>{row.cantidad}</td>
                    <td><strong>${row.total.toFixed(2)}</strong></td>
                  </tr>
                ))}
                {reporte.adicionales.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign: 'center'}}>No hay guías adicionales en este periodo.</td></tr>
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total de prefactura:</td>
                    <td><strong>${reporte.adicionales.reduce((acc: number, g: any) => acc + g.valor_base_cobrado + g.adicionales.reduce((s: number, a: any) => s + a.valor, 0), 0).toFixed(2)}</strong></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          </div>
        );
      })()}
    </div>
  );
}

