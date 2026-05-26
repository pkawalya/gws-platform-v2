// GWS Platform V2 — Prisma Config
import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { resolve } from "path";

// Explicitly load .env from THIS directory with override (parent has a stale one)
config({ path: resolve(import.meta.dirname, ".env"), override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
