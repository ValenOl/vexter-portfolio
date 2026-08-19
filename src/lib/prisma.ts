import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

// Prisma 7 requiere un driver adapter explícito -- ya no lee DATABASE_URL
// solo. Ver prisma.config.ts (usado por Migrate/CLI) y
// https://pris.ly/d/prisma7-client-config
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

// Singleton estándar de Prisma en Next.js -- evita agotar conexiones por
// hot-reload en dev (cada reload reimporta el módulo, pero el global
// persiste entre reimports).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
