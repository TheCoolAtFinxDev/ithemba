import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  datasource: {
    url: "postgresql://postgres.seodrkgpfytwofwozitt:qU9ne%24q%232Ah%2Fy%3Fy@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
  },
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { Pool } = await import('pg');
      const pool = new Pool({
        host: 'aws-0-eu-west-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.seodrkgpfytwofwozitt',
        password: 'qU9ne$q#2Ah/y?y',
        ssl: { rejectUnauthorized: false },
      });
      return new PrismaPg(pool);
    },
  },
});