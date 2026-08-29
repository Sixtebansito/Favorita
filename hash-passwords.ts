import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  let updatedCount = 0;

  for (const user of users) {
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      console.log(`Hashing password for user: ${user.email}`);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      updatedCount++;
    } else {
      console.log(`User ${user.email} already has a hashed password.`);
    }
  }

  console.log(`Finished. Updated ${updatedCount} users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
