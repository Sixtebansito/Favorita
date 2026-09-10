const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const guias = await prisma.guia.findMany({
    where: { estado: 'ACTIVA' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { guiaPrecio: true }
  });
  console.log(guias.map(g => ({
    id: g.id,
    cliente_destino: g.cliente_destino,
    descripcion: g.guiaPrecio?.descripcion,
    fecha: g.fecha_guia
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
