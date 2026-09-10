'use client';

import { useState } from 'react';
import { generateBackupData, guardarConfiguracion, registrarBackupManual } from '@/app/actions/backup';

interface BackupHistoryItem {
  id: string;
  tipo: string;
  enviadoA: string | null;
  createdAt: Date;
}

export default function BackupClient({
  historial,
  configInicial
}: {
  historial: BackupHistoryItem[];
  configInicial: { destino: string; estado: boolean };
}) {
  const [destino, setDestino] = useState(configInicial.destino);
  const [estado, setEstado] = useState(configInicial.estado);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingConfig(true);
    setMessage({ type: '', text: '' });
    const res = await guardarConfiguracion(destino, estado);
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
    }
    setLoadingConfig(false);
  };

  const handleDownloadBackup = async () => {
    if (!confirm('¿Estás seguro de generar un backup completo? Puede tardar unos segundos.')) return;
    setLoadingBackup(true);
    setMessage({ type: '', text: '' });
    try {
      const { data, metadata } = await generateBackupData();
      const payload = { metadata, data };
      
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_favorita_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Registrar historial
      await registrarBackupManual();
      setMessage({ type: 'success', text: 'Backup descargado exitosamente.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error descargando backup' });
    }
    setLoadingBackup(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Generar Backup Manual */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Backup Manual</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Descarga un respaldo completo de la base de datos en formato JSON en este momento.
          </p>
          <button 
            onClick={handleDownloadBackup}
            disabled={loadingBackup}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: loadingBackup ? 'not-allowed' : 'pointer',
              opacity: loadingBackup ? 0.7 : 1,
            }}
          >
            {loadingBackup ? 'Generando...' : 'Descargar Backup (.json)'}
          </button>
        </div>

        {/* Configuración de Backup Automático */}
        <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Automatización (Cada 72 hrs)</h2>
          <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={estado} 
                  onChange={(e) => setEstado(e.target.checked)} 
                  style={{ width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: 500 }}>Habilitar envío por correo</span>
              </label>
            </div>
            
            {estado && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500 }}>Correo Destino</label>
                <input 
                  type="email" 
                  value={destino} 
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="ejemplo@gmail.com"
                  required={estado}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={loadingConfig}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                cursor: loadingConfig ? 'not-allowed' : 'pointer',
                opacity: loadingConfig ? 0.7 : 1,
                alignSelf: 'flex-start'
              }}
            >
              {loadingConfig ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </form>
        </div>

        {message.text && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '6px', 
            background: message.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: message.type === 'error' ? '#991b1b' : '#166534',
          }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Historial de Backups */}
      <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 600 }}>Historial de Backups</h2>
        
        {historial.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Aún no se ha registrado ningún backup.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
            {historial.map((h) => (
              <div key={h.id} style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    background: h.tipo === 'MANUAL' ? '#f1f5f9' : '#e0e7ff',
                    color: h.tipo === 'MANUAL' ? '#475569' : '#4338ca',
                  }}>
                    {h.tipo}
                  </span>
                  <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 500 }}>
                    {new Date(h.createdAt).toLocaleString('es-ES')}
                  </div>
                </div>
                {h.enviadoA && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right' }}>
                    Enviado a:<br/>{h.enviadoA}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
