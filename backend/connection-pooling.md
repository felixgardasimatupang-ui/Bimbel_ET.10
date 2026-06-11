# Connection Pooling untuk Production

## Supabase Production (Cloud)

Supabase menyediakan PgBouncer dalam mode **transaction pooling**.
Gunakan connection string dengan port `6543` (bukan `5432`):

```env
# Transaction mode (via PgBouncer) — untuk serverless / HTTP requests
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres"

# Session mode (direct) — untuk long-running tasks / migrations
DATABASE_URL_DIRECT="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```

## Local Development

```env
# Langsung ke PostgreSQL (tanpa PgBouncer)
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
DATABASE_URL_DIRECT="postgresql://postgres:postgres@localhost:54322/postgres"
```

## Prisma + PgBouncer

Wajib set parameter berikut di `datasource` block `schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL_DIRECT")
}
```

- `url` = PgBouncer (transaction pooling) — digunakan Prisma Client
- `directUrl` = direct PostgreSQL — digunakan `prisma migrate` dan `prisma db push`

## Limitasi PgBouncer

- Tidak support `LISTEN`/`NOTIFY` (Supabase Realtime tetap berfungsi via channel terpisah)
- Tidak support `PREPARE` statements dengan binary parameters
- Prisma menggunakan `pgBouncer: true` di connection string untuk kompatibilitas
