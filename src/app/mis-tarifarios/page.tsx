import { prisma } from '@/lib/prisma';
import MisTarifariosClient from './MisTarifariosClient';
import { getUserSession } from '../actions/auth';
import { redirect } from 'next/navigation';

export default async function MisTarifariosPage() {
  const session = await getUserSession();
  if (!session) redirect('/login');

  const misPrecios = await prisma.guiaPrecio.findMany({
    where: {
      userId: session.id
    },
    include: {
      tarifario: true
    },
    orderBy: {
      codigo: 'asc'
    }
  });

  return <MisTarifariosClient misPrecios={misPrecios} />;
}
