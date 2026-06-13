-- AlterTable: password nullable, tambah kolom OAuth
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "provider" TEXT;
ALTER TABLE "users" ADD COLUMN "provider_id" TEXT;

-- CreateIndex untuk provider
CREATE INDEX "users_provider_idx" ON "users"("provider");
