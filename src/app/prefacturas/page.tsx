import { prisma } from '@/lib/prisma';
import PrefacturaClient from './PrefacturaClient';
import { getUserSession } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function PrefacturasPage() {
  const session = await getUserSession();
  if (!session) redirect('/login');

  const isAdmin = session.role === 'ADMIN';

  const transportistas = await prisma.transportista.findMany({
    where: isAdmin ? undefined : {
      users: {
        some: {
          id: session.id
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Generación de Prefacturas</h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>Selecciona un transportista y un rango de fechas para generar el reporte consolidado.</p>
      </header>

      <PrefacturaClient transportistas={transportistas} />
    </div>
  );
}
