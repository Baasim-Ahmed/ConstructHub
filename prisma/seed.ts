import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Idempotent seed script.
 * - Reads ADMIN_EMAIL and ADMIN_PASSWORD from env (defaults provided for dev).
 * - Upserts clients by email.
 * - Upserts admin user by email and hashes provided password.
 * - Upserts example projects (by name) linked to client ids and admin id.
 *
 * Usage:
 *   - Set DATABASE_URL in your environment (or .env) before running.
 *   - Optionally set ADMIN_EMAIL and ADMIN_PASSWORD to override defaults.
 */

async function main() {
  console.log("🌱 Seeding database (idempotent)...");

  // Clients to ensure exist (upsert by email if provided)
  const clientsData = [
    {
      name: "John Construction Co.",
      email: "contact@johnconstruction.com",
      phone: "0321-4455667",
      companyName: "John Construction Co.",
      address: "Karachi, Pakistan",
    },
    {
      name: "Elite Builders",
      email: "info@elitebuilders.com",
      phone: "0300-9876543",
      companyName: "Elite Builders & Developers",
      address: "Islamabad, Pakistan",
    },
    {
      name: "Metro Engineering",
      email: "admin@metroeng.com",
      phone: "0315-1234567",
      companyName: "Metro Engineering Group",
      address: "Lahore, Pakistan",
    },
  ];

  const clients: Record<string, any> = {};
  for (const c of clientsData) {
    if (!c.email) continue;
    // email is not a unique field in the schema, so use findFirst then update/create by id
    const existing = await prisma.client.findFirst({ where: { email: c.email } });
    let clientRecord;
    if (existing) {
      clientRecord = await prisma.client.update({
        where: { id: existing.id },
        data: {
          name: c.name,
          phone: c.phone,
          companyName: c.companyName,
          address: c.address,
        },
      });
    } else {
      clientRecord = await prisma.client.create({ data: c });
    }
    clients[c.email] = clientRecord;
  }

  console.log('✔ Clients upserted');

  // Admin credentials (safe defaults for local dev only)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@constructhub.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

  // Upsert admin user by email. If password env is provided we always hash and set it.
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Admin User',
      phone: '0300-0000000',
      role: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      name: 'Admin User',
      email: ADMIN_EMAIL,
      phone: '0300-0000000',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });

  console.log(`✔ Admin user upserted (email: ${ADMIN_EMAIL})`);

  // Manager credentials
  const MANAGER_EMAIL = process.env.MANAGER_EMAIL || 'manager@constructhub.com';
  const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD || 'password';

  const hashedManagerPassword = await bcrypt.hash(MANAGER_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: MANAGER_EMAIL },
    update: {
      name: 'Manager User',
      phone: '0300-1111111',
      role: 'MANAGER',
      password: hashedManagerPassword,
    },
    create: {
      name: 'Manager User',
      email: MANAGER_EMAIL,
      phone: '0300-1111111',
      role: 'MANAGER',
      password: hashedManagerPassword,
    },
  });

  console.log('✔ Manager user upserted');

  // Create Specific Requested Users
  const specificUsers = [
    { name: 'Abdur Rafay', email: 'abdur.rafay@constructhub.com', role: 'ADMIN' },
    { name: 'Saad', email: 'saad@constructhub.com', role: 'ADMIN' },
    { name: 'Huzaifa', email: 'huzaifa@constructhub.com', role: 'ENGINEER' },
    { name: 'Ahsan', email: 'ahsan@constructhub.com', role: 'MANAGER' },
    { name: 'New Admin', email: 'admin@live.com', role: 'ADMIN', password: '123456' },
  ];

  for (const u of specificUsers) {
    const pwd = (u as any).password || 'password';
    const hashedPassword = await bcrypt.hash(pwd, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role as any,
        password: hashedPassword,
      },
      create: {
        name: u.name,
        email: u.email,
        role: u.role as any,
        password: hashedPassword,
      },
    });
  }
  console.log('✔ Specific users upserted (Default password: "password")');

  // Create Dev Users for specific roles (keeping these for testing if needed)
  const devUsers = [
    { id: 'dev-client', name: 'Dev Client', email: 'dev@client.local', role: 'CLIENT' },
    // Generic user removed
  ];

  for (const u of devUsers) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        name: u.name,
        email: u.email,
        role: u.role as any,
        password: await bcrypt.hash('password', 10),
      },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as any,
        password: await bcrypt.hash('password', 10),
      },
    });
  }
  console.log('✔ Dev users upserted');

  // Example projects to upsert (link to clients and admin)
  const projectsData = [
    {
      name: 'Housing Project Phase 1',
      description: 'Residential construction covering 50 acres.',
      clientEmail: 'contact@johnconstruction.com',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-01'),
    },
    {
      name: 'Office Tower Karachi',
      description: '30-floor corporate office building.',
      clientEmail: 'info@elitebuilders.com',
      status: 'PLANNING',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-03-01'),
    },
  ];

  for (const p of projectsData) {
    const client = clients[p.clientEmail];
    if (!client) {
      console.warn(`Skipping project upsert, client not found: ${p.clientEmail}`);
      continue;
    }
    // name is not a unique field in the schema, so find first by name then update/create by id
    const existingProject = await prisma.project.findFirst({ where: { name: p.name } });
    if (existingProject) {
      await prisma.project.update({
        where: { id: existingProject.id },
        data: {
          description: p.description,
          clientId: client.id,
          managerId: adminUser.id,
          status: p.status as any,
          startDate: p.startDate,
          endDate: p.endDate,
        },
      });
    } else {
      await prisma.project.create({
        data: {
          name: p.name,
          description: p.description,
          clientId: client.id,
          managerId: adminUser.id,
          status: p.status as any,
          startDate: p.startDate,
          endDate: p.endDate,
        },
      });
    }
  }

  console.log('✔ Projects upserted');

  console.log('\n--- Summary ---');
  console.log(`Admin: ${ADMIN_EMAIL}`);
  console.log(`Manager: ${MANAGER_EMAIL}`);
  console.log('Password: (the value from env or the default "password")');
  console.log('--- End summary ---\n');
}

main()
  .then(() => console.log('🌱 Seeding complete'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
