import { getUserSession } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { obtenerHistorialYConfiguracion } from '@/app/actions/backup';
import BackupClient from './BackupClient';

export default async function BaseDeDatosPage() {
  const session = await getUserSession();
  if (!session || session.role !== 'ADMIN') redirect('/login');

  const result = await obtenerHistorialYConfiguracion();
  
  if (result.error) {
    return <div style={{ padding: '2rem' }}>Error cargando la página de Base de Datos.</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Base de Datos y Backups</h1>
      <BackupClient 
        historial={result.historial || []} 
        configInicial={result.config || { destino: '', estado: false }} 
      />
    </div>
  );
}
