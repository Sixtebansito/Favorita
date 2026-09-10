import { redirect } from 'next/navigation';
import { getUserSession } from '../actions/auth';
import { prisma } from '@/lib/prisma';
import GastosClient from './GastosClient';

export default async function GastosPage() {
  const session = await getUserSession();
  
  if (!session) {
    redirect('/login');
  }

  // Si es ADMIN, traer todos los transportistas. Si es USER, solo los asignados.
  let transportistas: any[] = [];
  if (session.role === 'ADMIN') {
    transportistas = await prisma.transportista.findMany({
      orderBy: { name: 'asc' },
      include: {
        cabezales: {
          orderBy: { placa: 'asc' }
        }
      }
    });
  } else {
    // Buscar los transportistas del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        transportistas: {
          orderBy: { name: 'asc' },
          include: {
            cabezales: {
              orderBy: { placa: 'asc' }
            }
          }
        },
      },
    });
    if (user && user.transportistas) {
      transportistas = user.transportistas;
    }
  }

  // Extraer los gastos recientes, filtrando si es USER
  let gastosInit: any[] = [];
  let cierresInit: any[] = [];
  
  if (session.role === 'ADMIN') {
    gastosInit = await prisma.gasto.findMany({
      where: { estado: 'ACTIVO' },
      include: {
        cabezal: true,
        transportista: true,
      },
      orderBy: {
        fecha: 'desc',
      },
      take: 100,
    });

    cierresInit = await prisma.cierreMesGasto.findMany({
      include: { transportista: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } else {
    const transportistaIds = transportistas.map(t => t.id);
    gastosInit = await prisma.gasto.findMany({
      where: {
        transportistaId: { in: transportistaIds },
        estado: 'ACTIVO'
      },
      include: {
        cabezal: true,
        transportista: true,
      },
      orderBy: {
        fecha: 'desc',
      },
      take: 100,
    });

    cierresInit = await prisma.cierreMesGasto.findMany({
      where: { transportistaId: { in: transportistaIds } },
      include: { transportista: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  return (
    <div className="container" style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Registro de Gastos</h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>
          Registra y administra los gastos operativos (combustibles, llantas, peajes, etc.)
        </p>
      </header>

      <GastosClient 
        transportistas={transportistas} 
        gastosIniciales={gastosInit}
        cierresIniciales={cierresInit}
        isAdmin={session.role === 'ADMIN'}
      />
    </div>
  );
}
