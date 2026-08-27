import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de usuario administrador...');

  const passwordHash = await hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'dannygghhm@gmail.com' },
    update: {},
    create: {
      name: 'Danny Admin',
      email: 'dannygghhm@gmail.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Usuario administrador creado con éxito en la nube:', adminUser.email);
  console.log('¡Ya puedes iniciar sesión en Vercel!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
