import { redirect } from 'next/navigation';
import { getUserSession } from '../actions/auth';
import { prisma } from '@/lib/prisma';
import { Wrench } from 'lucide-react';
import BitacoraClient from './BitacoraClient';

export default async function BitacoraPage() {
  const session = await getUserSession();
  
  if (!session) {
    redirect('/');
  }

  // Get user's transportistas
  let transportistas = [];

  if (session.role === 'ADMIN') {
    transportistas = await prisma.transportista.findMany({
      orderBy: { name: 'asc' },
      include: { cabezales: true }
    });
  } else {
    // If user is NORMAL or PLUS, fetch assigned transportistas
    const userWithTransportistas = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        transportistas: {
          include: { cabezales: true }
        }
      }
    });
    transportistas = (userWithTransportistas?.transportistas || []).sort((a, b) => a.name.localeCompare(b.name));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench className="h-6 w-6 text-blue-600" />
          Bitácora de Mantenimiento
        </h1>
        <p className="text-sm text-gray-500 mt-1">Lleva el registro de mantenimientos de cada cabezal (cambios de aceite, llantas, etc.)</p>
      </div>

      <BitacoraClient transportistasIniciales={transportistas} />
    </div>
  );
}
