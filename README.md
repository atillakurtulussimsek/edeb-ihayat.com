# Edebi Hayat – Canlı Ders Platformu

Next.js 16 · Prisma 7 (MySQL) · Auth.js · BigBlueButton · shadcn/ui

## Kurulum

```bash
cp .env.example .env        # değerleri doldur
npm install
npx prisma migrate dev --name init
npm run db:seed             # ilk öğretmen hesabı
npm run dev
```

## Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | `mysql://kullanici:sifre@host:3306/veritabani` |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | Uygulamanın tam adresi |
| `BBB_URL` | `https://bbb.example.com/bigbluebutton/` |
| `BBB_SECRET` | BBB sunucusunda `bbb-conf --secret` |
| `TEACHER_EMAIL` / `TEACHER_PASSWORD` / `TEACHER_NAME` | Seed için öğretmen hesabı |

## Roller

- **Öğretmen**: öğrenci ekler, bireysel/grup ders planlar, dersi başlatır (BBB odası otomatik açılır), sonlandırır, kayıtları görür.
- **Kayıt**: tüm dersler zorunlu olarak kaydedilir (`autoStartRecording=true`, durdurulamaz). KVKK sorumluluğu platform sahibine aittir.
- **Çoklu öğretmen**: her öğretmen yalnız kendi öğrencilerini ve derslerini görür; mevcut öğretmenler `/teachers` sayfasından yeni öğretmen ekleyebilir.
- **Öğrenci**: kendi derslerini görür, öğretmen odayı açınca tek tıkla katılır, kayıtları izler.
