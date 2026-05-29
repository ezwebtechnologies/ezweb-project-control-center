import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

const prisma = new PrismaClient();

async function wipeAllData() {
  await prisma.taskLabel.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.label.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  const email = (
    process.env.SEED_ADMIN_EMAIL?.trim() || "admin@ezweb.com"
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required. Example: SEED_ADMIN_PASSWORD='your-password' npm run db:seed"
    );
  }

  console.log("Wiping all data…");
  await wipeAllData();

  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
      mustChangePassword: false,
      canViewPayments: true,
      canViewClients: true,
      canViewAllProjects: true,
    },
  });

  console.log(`Done. Only admin account remains: ${email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
