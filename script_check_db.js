import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  const tasks = await prisma.task.count();
  console.log({ users, projects, tasks });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
