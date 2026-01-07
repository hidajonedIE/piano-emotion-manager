import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: [
    './drizzle/schema.ts',
    './drizzle/modules-schema.ts',
    './drizzle/inventory-schema.ts',
    './drizzle/crm-schema.ts',
    './drizzle/calendar-schema.ts',
    './drizzle/accounting-schema.ts',
    './drizzle/shop-schema.ts',
  ],
  out: './drizzle/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: true
    }
  },
  casing: 'preserve', // Preservar el casing exacto de los nombres de columna
});
