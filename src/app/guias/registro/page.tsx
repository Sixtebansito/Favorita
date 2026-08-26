import { prisma } from '@/lib/prisma';
import RegistroGuiaClient from './RegistroGuiaClient';
import { getUserSession } from '../../actions/auth';
import { redirect } from 'next/navigation';

export default async function RegistroGuiasPage() {
  const session = await getUserSession();
  if (!session) redirect('/login');

  const isAdmin = session.role === 'ADMIN';

  const cabezales = await prisma.cabezal.findMany({
    where: isAdmin ? undefined : {
      transportista: {
        users: {
          some: {
            id: session.id
          }
        }
      }
    },
    include: {
      transportista: true
    }
  });

  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Registro de Guías</h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>Ingresa una nueva guía de transporte. El sistema asignará el valor automáticamente basado en la fecha.</p>
      </header>

      <RegistroGuiaClient cabezales={cabezales} />
    </div>
  );
}
