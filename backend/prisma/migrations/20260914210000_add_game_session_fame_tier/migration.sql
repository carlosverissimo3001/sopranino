-- CreateEnum
CREATE TYPE "FameTier" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT', 'IMPOSSIBLE');

-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN     "fame_tier" "FameTier";
