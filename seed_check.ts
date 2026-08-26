import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users in DB:", users);
  
  if (users.length === 0) {
    console.log("Creating default admin user...");
    await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        password: 'admin',
        name: 'Administrador',
        role: 'ADMIN'
      }
    });
    console.log("Default admin created: admin@admin.com / admin");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
