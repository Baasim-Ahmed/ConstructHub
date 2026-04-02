const fs = require('fs');
// Load .env manually for standalone scripts so Prisma can read DATABASE_URL
try {
  const env = fs.readFileSync('.env', 'utf8');
  env.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      const key = m[1];
      let val = m[2] || '';
      // strip surrounding quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  });
} catch (err) {
  // ignore if .env not found; Prisma will error with a clear message
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } });
    const projects = await prisma.project.findMany({ select: { id: true, name: true, status: true, clientId: true, managerId: true } });
    const tasks = await prisma.task.findMany({ select: { id: true, title: true, status: true, projectId: true, assignedToId: true } });
    const clients = await prisma.client.findMany({ select: { id: true, name: true, email: true } });

    console.log(JSON.stringify({ users, projects, tasks, clients }, null, 2));
  } catch (err) {
    console.error('Error fetching data:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
