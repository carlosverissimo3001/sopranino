-- CreateEnum
CREATE TYPE "PlaylistSource" AS ENUM ('DEEZER', 'SPOTIFY', 'APPLE_MUSIC');

-- AlterEnum
ALTER TYPE "GauntletSource" ADD VALUE 'IMPORTED';

-- AlterEnum
ALTER TYPE "TrackGroupType" ADD VALUE 'IMPORTED';

-- DropIndex
DROP INDEX "track_groups_type_name_key";

-- CreateTable
CREATE TABLE "playlist_imports" (
    "track_group_id" TEXT NOT NULL,
    "source" "PlaylistSource" NOT NULL,
    "external_id" TEXT NOT NULL,
    "checksum" TEXT,
    "refreshed_at" TIMESTAMP(3),
    "stale_since" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_imports_pkey" PRIMARY KEY ("track_group_id")
);

-- CreateTable
CREATE TABLE "track_group_members" (
    "user_id" TEXT NOT NULL,
    "track_group_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_group_members_pkey" PRIMARY KEY ("user_id","track_group_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "playlist_imports_source_external_id_key" ON "playlist_imports"("source", "external_id");

-- CreateIndex
CREATE INDEX "track_group_members_track_group_id_idx" ON "track_group_members"("track_group_id");

-- AddForeignKey
ALTER TABLE "playlist_imports" ADD CONSTRAINT "playlist_imports_track_group_id_fkey" FOREIGN KEY ("track_group_id") REFERENCES "track_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_group_members" ADD CONSTRAINT "track_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "track_group_members" ADD CONSTRAINT "track_group_members_track_group_id_fkey" FOREIGN KEY ("track_group_id") REFERENCES "track_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
