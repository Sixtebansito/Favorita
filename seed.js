const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creando usuario administrador en la base de datos...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'dannygghhm@gmail.com' },
    update: {},
    create: {
      name: 'Danny Admin',
      email: 'dannygghhm@gmail.com',
      password: 'admin', // Puedes cambiar esto
      role: 'ADMIN',
    },
  });

  console.log('¡Usuario creado en la nube con éxito!', adminUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
