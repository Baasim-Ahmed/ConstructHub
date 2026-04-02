const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('Migrating users with role USER to CLIENT...');
    try {
        const result = await prisma.user.updateMany({
            where: {
                role: 'USER'
            },
            data: {
                role: 'CLIENT'
            }
        });
        console.log(`Updated ${result.count} users.`);
    } catch (e) {
        console.error("Error updating users:", e);
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
