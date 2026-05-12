import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  /**
   * Avoid drizzle-kit introspection walking `auth`, `storage`, etc. (Supabase) —
   * that triggers a known bug: CHECK parser gets undefined (`checkValue.replace`).
   * @see https://github.com/drizzle-team/drizzle-orm/issues/5599
   */
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
