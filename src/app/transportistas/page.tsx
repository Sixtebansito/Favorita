import { prisma } from '@/lib/prisma';
import TransportistaClient from './TransportistaClient';
import { getUserSession } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function TransportistasPage() {
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
    include: {
      cabezales: true,
      users: true,
      liquidaciones: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const usuarios = isAdmin ? await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' }
  }) : [];

  return (
    <div className="page-container">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, letterSpacing: '-0.025em' }}>Gestión de Transportistas y Cabezales</h1>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>Administra los transportistas y sus vehículos asociados.</p>
      </header>

      <TransportistaClient transportistas={transportistas} usuarios={usuarios} isAdmin={isAdmin} />
    </div>
  );
}
