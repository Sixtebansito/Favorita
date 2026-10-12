import { prisma } from '@/lib/prisma';
import PrefacturaClient from './PrefacturaClient';
import { getUserSession } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function PrefacturasPage({
  searchParams,
}: {
  searchParams?: Promise<{ cierreId?: string; transportistaId?: string }>;
}) {
  const session = await getUserSession();
  if (!session) redirect('/login');

  const resolvedParams = searchParams ? await searchParams : {};
  const initialCierreId = resolvedParams.cierreId || '';
  const initialTransportistaId = resolvedParams.transportistaId || '';

  const isAdmin = session.role === 'ADMIN';

  const transportistas = await prisma.transportista.findMany({
    where: isAdmin ? undefined : {
      users: {
        some: {
          id: session.id
        }
      }
    },
    include: {
      cabezales: true
    },
    orderBy: { name: 'asc' }
  });

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
        select: {
          id: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const cierresActivos = cierres
    .filter(c => c.guias.length > 0)
    .map(c => ({
      id: c.id,
      transportistaId: c.transportistaId,
      transportistaNombre: c.transportista.name,
      tipo: c.tipo,
      total: c.total,
      total_tickets: c.total_tickets,
      guiasCount: c.guias.length,
      createdAt: c.createdAt.toISOString()
    }));

  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Generación de Prefacturas</h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
          Selecciona una semana cuadrada o un rango de fechas para generar el reporte consolidado.
        </p>
      </header>

      <PrefacturaClient 
        transportistas={transportistas}
        cierres={cierresActivos}
        initialCierreId={initialCierreId}
        initialTransportistaId={initialTransportistaId}
      />
    </div>
  );
}
