import { prisma } from '@/lib/prisma';
import TarifarioClient from './TarifarioClient';
import { getUserSession } from '../actions/auth';

export default async function TarifariosPage() {
  const session = await getUserSession();
  const tarifarios = await prisma.tarifario.findMany({
    include: {
      precios: true,
    },
    orderBy: {
      fecha_vigencia: 'desc'
    }
  });

  return <TarifarioClient tarifarios={tarifarios} userRole={session?.role || 'USER'} />;
}
