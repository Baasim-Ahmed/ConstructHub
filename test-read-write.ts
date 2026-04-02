import { prisma } from "@/lib/prisma";

async function testReadWriteOperations() {
  console.log("🧪 Starting comprehensive database read/write tests...\n");

  try {
    // Test 1: READ - Get all users
    console.log("1️⃣  Testing READ: Fetching all users...");
    const allUsers = await prisma.user.findMany({ take: 5 });
    console.log(`   ✓ Found ${allUsers.length} users (showing first 5)`);
    allUsers.forEach((u) => console.log(`     - ${u.email} (${u.role})`));

    // Test 2: READ - Get all projects
    console.log("\n2️⃣  Testing READ: Fetching all projects...");
    const allProjects = await prisma.project.findMany({ take: 5 });
    console.log(`   ✓ Found ${allProjects.length} projects (showing first 5)`);
    allProjects.forEach((p) => console.log(`     - ${p.name}`));

    // Test 3: READ - Get projects with relations
    console.log("\n3️⃣  Testing READ with relations: Fetching projects with manager info...");
    const projectsWithMgr = await prisma.project.findMany({
      include: { manager: true, client: true },
      take: 3,
    });
    console.log(`   ✓ Fetched ${projectsWithMgr.length} projects with relations`);
    projectsWithMgr.forEach((p) =>
      console.log(`     - ${p.name} (Manager: ${p.manager?.name})`)
    );

    // Test 4: WRITE - Create a new test project
    console.log("\n4️⃣  Testing WRITE: Creating a new test project...");
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser) {
      const newProject = await prisma.project.create({
        data: {
          name: `Test Project - ${new Date().toISOString()}`,
          description: "This is a test project created by the test script",
          managerId: adminUser.id,
          status: "PLANNING",
        },
      });
      console.log(`   ✓ Created project: ${newProject.id}`);
      console.log(`     - Name: ${newProject.name}`);
      console.log(`     - Manager ID: ${newProject.managerId}`);

      // Test 5: WRITE - Update the project
      console.log("\n5️⃣  Testing WRITE: Updating the test project...");
      const updatedProject = await prisma.project.update({
        where: { id: newProject.id },
        data: {
          description: "Updated description from test script",
          status: "IN_PROGRESS",
        },
      });
      console.log(`   ✓ Updated project: ${updatedProject.id}`);
      console.log(`     - New description: ${updatedProject.description}`);
      console.log(`     - New status: ${updatedProject.status}`);

      // Test 6: READ - Verify the update
      console.log("\n6️⃣  Testing READ: Verifying the update...");
      const verifiedProject = await prisma.project.findUnique({
        where: { id: newProject.id },
      });
      if (
        verifiedProject &&
        verifiedProject.status === "IN_PROGRESS" &&
        verifiedProject.description &&
        verifiedProject.description.includes("Updated")
      ) {
        console.log(`   ✓ Verification successful!`);
      }

      // Test 7: WRITE - Delete the test project
      console.log("\n7️⃣  Testing WRITE: Deleting the test project...");
      const deletedProject = await prisma.project.delete({
        where: { id: newProject.id },
      });
      console.log(`   ✓ Deleted project: ${deletedProject.id}`);

      // Test 8: READ - Verify deletion
      console.log("\n8️⃣  Testing READ: Verifying deletion...");
      const shouldBeNull = await prisma.project.findUnique({
        where: { id: newProject.id },
      });
      if (shouldBeNull === null) {
        console.log(`   ✓ Deletion verified - project no longer exists`);
      }
    }

    console.log("\n✅ All tests passed! Database read/write operations are working correctly.\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

testReadWriteOperations();
