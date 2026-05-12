import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/credex";

// Create the connection
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

