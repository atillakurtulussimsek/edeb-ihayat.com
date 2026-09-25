import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error("Kullanım: npm run make-admin -- eposta@ornek.com");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!) });
prisma.user
  .updateMany({ where: { email, role: { in: ["TEACHER", "ADMIN"] } }, data: { role: "ADMIN" } })
  .then((r) => console.log(r.count ? `Yönetici yapıldı: ${email}` : `Öğretmen hesabı bulunamadı: ${email}`))
  .finally(() => prisma.$disconnect());
