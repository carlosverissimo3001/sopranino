-- AlterEnum
ALTER TYPE "FeedbackKind" ADD VALUE 'ARTIST_REQUEST';

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "normalized_message" TEXT;

-- CreateIndex
CREATE INDEX "feedback_kind_normalized_message_idx" ON "feedback"("kind", "normalized_message");
