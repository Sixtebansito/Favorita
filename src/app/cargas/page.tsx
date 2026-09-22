import { prisma } from '@/lib/prisma';
import CargasClient from './CargasClient';

export default async function CargasPage() {
  const cabezales = await prisma.cabezal.findMany({
    include: { transportista: true },
    orderBy: { placa: 'asc' }
  });

  return (
    <div className="page-container">
      <CargasClient cabezales={cabezales} />
    </div>
  );
}
