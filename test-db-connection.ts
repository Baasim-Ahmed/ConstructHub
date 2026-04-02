import { prisma } from "@/lib/prisma";

async function testDbConnection() {
  try {
    console.log("Testing database connection...");
    
    // Test 1: Count users
    const userCount = await prisma.user.count();
    console.log(`✓ Users count: ${userCount}`);
    
    // Test 2: Count projects
    const projectCount = await prisma.project.count();
    console.log(`✓ Projects count: ${projectCount}`);
    
    // Test 3: Try to find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: "admin@constructhub.com" }
    });
    console.log(`✓ Admin user found:`, adminUser ? { id: adminUser.id, email: adminUser.email } : "Not found");
    
    // Test 4: Try to fetch projects with relations
    const projects = await prisma.project.findMany({
      include: { manager: true, client: true },
      take: 2
    });
    console.log(`✓ Projects with relations:`, projects.length);
    
    console.log("\n✅ All database tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database error:", error);
    process.exit(1);
  }
}

testDbConnection();
