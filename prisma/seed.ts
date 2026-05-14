import {
  PaymentStatus,
  PrismaClient,
  ProjectPriority,
  ProjectStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.taskLabel.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.label.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin",
      passwordHash: null,
    },
  });

  const c1 = await prisma.client.create({
    data: {
      name: "Jordan Lee",
      companyName: "Northwind Integrations",
      email: "jordan@northwind.example",
      phone: "+1 415 555 0101",
      address: "100 Market St, San Francisco, CA",
    },
  });

  const c2 = await prisma.client.create({
    data: {
      name: "Sam Rivera",
      companyName: "Apex Retail Group",
      email: "sam@apexretail.example",
      phone: "+1 212 555 0199",
      address: "450 Lexington Ave, New York, NY",
    },
  });

  const p1 = await prisma.project.create({
    data: {
      clientId: c1.id,
      name: "Order-to-Cash API Platform",
      description: "MuleSoft-led O2C modernization with Salesforce CPQ.",
      status: ProjectStatus.IN_DEVELOPMENT,
      priority: ProjectPriority.HIGH,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21),
      progress: 60,
      tags: ["MuleSoft", "Salesforce", "API"],
    },
  });

  const p2 = await prisma.project.create({
    data: {
      clientId: c2.id,
      name: "Store Inventory Sync",
      description: "Near real-time inventory between POS and ERP.",
      status: ProjectStatus.CLIENT_UAT,
      priority: ProjectPriority.MEDIUM,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9),
      progress: 80,
      tags: ["Kafka", "ERP"],
    },
  });

  await prisma.project.create({
    data: {
      clientId: c1.id,
      name: "Partner Onboarding Portal",
      description: "Self-service onboarding with DocuSign.",
      status: ProjectStatus.PROPOSAL_APPROVED,
      priority: ProjectPriority.LOW,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      progress: 25,
      tags: ["Experience API"],
      archivedAt: null,
    },
  });

  const now = new Date();
  await prisma.payment.createMany({
    data: [
      {
        clientId: c1.id,
        projectId: p1.id,
        amount: 48000,
        status: PaymentStatus.PAID,
        invoiceNumber: "INV-2026-001",
        paymentDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 12),
        dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
      },
      {
        clientId: c2.id,
        projectId: p2.id,
        amount: 22000,
        status: PaymentStatus.PENDING,
        invoiceNumber: "INV-2026-014",
        dueDate: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
      },
      {
        clientId: c1.id,
        amount: 12000,
        status: PaymentStatus.PARTIAL,
        invoiceNumber: "INV-2026-021",
        dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2),
      },
      {
        clientId: c2.id,
        amount: 9000,
        status: PaymentStatus.OVERDUE,
        invoiceNumber: "INV-2025-902",
        dueDate: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
      },
    ],
  });
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
