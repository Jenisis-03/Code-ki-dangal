import { PrismaClient } from '@prisma/client';

// Define Prisma client options for production optimization
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Log only errors in production
    log: process.env.NODE_ENV === 'production'
      ? ['error']
      : ['query', 'error', 'warn'],
    // Connection pooling configuration for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize query engine for production
    engineType: process.env.NODE_ENV === 'production' ? 'binary' : 'library',
  });
};

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Use existing instance or create a new one
export const db = globalForPrisma.prisma || prismaClientSingleton();

// Set global reference in development to prevent multiple connections
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Handle graceful shutdown to properly close database connections
if (process.env.NODE_ENV === 'production') {
  const handleShutdown = async () => {
    console.log('Closing database connections...');
    await db.$disconnect();
    process.exit(0);
  };

  // Listen for termination signals
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}