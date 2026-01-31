import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  out: './drizzle/introspected',
  dialect: 'mysql',
  dbCredentials: {
    host: 'gateway01.us-east-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3v9ofvvgodfeCHv.root',
    password: '9wl3Ks7pqSVjBamc',
    database: 'test',
    ssl: {
      rejectUnauthorized: false
    }
  },
  casing: 'camelCase',
});
