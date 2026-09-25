import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.TEACHER_EMAIL ?? "ogretmen@edebihayat.com";
  const password = process.env.TEACHER_PASSWORD ?? "degistir123";
  const name = process.env.TEACHER_NAME ?? "Öğretmen";

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "TEACHER" },
    create: { email, name, passwordHash, role: "TEACHER" },
  });
  console.log(`Öğretmen hesabı hazır: ${email}`);

  if (process.env.ADMIN_EMAIL) {
    const r = await prisma.user.updateMany({ where: { email: process.env.ADMIN_EMAIL.toLowerCase() }, data: { role: "ADMIN" } });
    console.log(r.count ? `Yönetici yapıldı: ${process.env.ADMIN_EMAIL}` : `Yönetici için hesap bulunamadı: ${process.env.ADMIN_EMAIL}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
