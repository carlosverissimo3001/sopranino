-- AlterEnum
ALTER TYPE "TrackSource" ADD VALUE 'SET';

-- AlterTable
ALTER TABLE "multiplayer_rooms" ADD COLUMN "track_group_id" TEXT;

-- AddForeignKey
ALTER TABLE "multiplayer_rooms" ADD CONSTRAINT "multiplayer_rooms_track_group_id_fkey" FOREIGN KEY ("track_group_id") REFERENCES "track_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
