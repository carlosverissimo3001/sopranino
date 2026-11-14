-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_user_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_user_id_key" ON "users"("google_user_id");

