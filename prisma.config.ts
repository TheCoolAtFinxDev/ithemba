import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Migrations need the direct (non-pooled) connection — DIRECT_URL, not
// DATABASE_URL (which is the session pooler used by the running app).
const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  throw new Error('DIRECT_URL is not set — check your .env file');
}

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: directUrl,
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: directUrl,
        ssl: { rejectUnauthorized: false },
      });
      return new PrismaPg(pool);
    },
  },
});