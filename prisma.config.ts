import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Build aşamasında (prisma generate) DB gerekmez; runtime'da gerçek değer zorunlu.
    url: process.env.DATABASE_URL ?? "mysql://build:build@localhost:3306/build",
  },
});
