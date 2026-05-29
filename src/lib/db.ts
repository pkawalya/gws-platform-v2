import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: pg.Pool | undefined
}

function getPool() {
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      host: 'pooled.db.prisma.io',
      port: 5432,
      database: 'postgres',
      user: '74fac8522f9f4853ff359b7132f6c62288f1b6c30b6662a06224e4708215bfb5',
      password: 'sk_vjZOzfwwXnFepaWbCeriL',
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  }
  return globalForPrisma.pgPool
}

function createPrismaClient() {
  const pool = getPool()
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
