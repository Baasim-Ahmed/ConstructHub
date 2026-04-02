const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const users = [
    {
        id: "admin-master",
        name: "Admin User",
        email: "admin@constructhub.com",
        role: "ADMIN",
        password: "123" // Will be hashed but technically not used by NextAuth for these hardcoded ones
    },
    {
        id: "manager-master",
        name: "Manager User",
        email: "manager@constructhub.com",
        role: "MANAGER",
        password: "123"
    },
    {
        id: "engineer-master",
        name: "Engineer User",
        email: "engineer@constructhub.com",
        role: "ENGINEER",
        password: "123"
    },
    {
        id: "client-master",
        name: "Client User",
        email: "client@constructhub.com",
        role: "CLIENT",
        password: "123"
    },
    {
        id: "user-master",
        name: "Regular User",
        email: "user@constructhub.com",
        role: "USER",
        password: "123"
    }
];

async function main() {
    console.log('Seeding master users...');

    for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { email: user.email },
            update: {
                id: user.id, // Ensure ID matches what NextAuth expects
                role: user.role,
                name: user.name,
            },
            create: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                password: hashedPassword,
            },
        });
        console.log(`Upserted user: ${user.email} with id: ${user.id}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
