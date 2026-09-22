import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cabezales = await prisma.cabezal.findMany({
    include: { transportista: true }
  });
  console.log("Total Cabezales:", cabezales.length);
  const otawas = cabezales.filter(c => c.tipo === 'OTAWA');
  console.log("OTAWAS count:", otawas.length);
  otawas.forEach(c => console.log(c.placa, c.transportista.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
