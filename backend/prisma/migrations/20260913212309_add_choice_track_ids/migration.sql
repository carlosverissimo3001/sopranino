-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN     "choice_track_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
