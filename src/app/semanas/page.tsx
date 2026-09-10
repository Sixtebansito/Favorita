import { prisma } from '@/lib/prisma';
import SemanasClient from './SemanasClient';
import { getUserSession } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function SemanasPage() {
  const session = await getUserSession();
  if (!session) redirect('/login');

  const isAdmin = session.role === 'ADMIN';

  const cierres = await prisma.cierreSemana.findMany({
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
      transportista: true,
      guias: {
        where: {
          estado: 'CUADRADA'
        },
        include: {
          cabezal: true,
          adicionales: true,
          guiaPrecio: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const cierresActivos = cierres.filter(c => c.guias.length > 0);

  const cabezales = await prisma.cabezal.findMany({
    where: isAdmin ? undefined : {
      transportista: {
        users: { some: { id: session.id } }
      }
    }
  });

  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Cierres de Semana</h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
          Historial de guías agrupadas y cuadradas semanalmente por transportista (pendientes de liquidar).
        </p>
      </header>

      <SemanasClient cierres={cierresActivos} cabezales={cabezales} />
    </div>
  );
}
