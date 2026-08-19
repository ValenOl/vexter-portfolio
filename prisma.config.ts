// dotenv por default solo lee ".env", no ".env.local" -- a diferencia de
// Next.js, que sí lo hace solo. Hay que apuntarlo a mano.
import { config } from 'dotenv'
import { defineConfig, env } from 'prisma/config'

config({ path: '.env.local' })

// Prisma 7: config nueva, separada del schema. Solo la usa Migrate/CLI
// (`prisma migrate dev`, `prisma studio`) -- la app en runtime usa el
// driver adapter en src/lib/prisma.ts, no este archivo.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
