import { prisma } from '@/lib/prisma';
import TarifarioClient from './TarifarioClient';

export default async function TarifariosPage() {
  const tarifarios = await prisma.tarifario.findMany({
    include: {
      precios: true,
    },
    orderBy: {
      fecha_vigencia: 'desc'
    }
  });

  return <TarifarioClient tarifarios={tarifarios} />;
}
