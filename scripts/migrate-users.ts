import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Migrating users with role USER to CLIENT...');
    // Update all users with role 'USER' to 'CLIENT'
    // Note: We need to cast to any if the types are strictly generated without USER already check for that.
    // But since we just regenerated with USER in schema, it should be fine.

    const result = await prisma.user.updateMany({
        where: {
            role: 'USER' as any
        },
        data: {
            role: 'CLIENT'
        }
    });

    console.log(`Updated ${result.count} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
