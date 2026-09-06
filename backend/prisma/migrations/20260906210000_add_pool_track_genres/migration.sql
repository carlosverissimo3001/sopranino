-- Empty until the backfill runs. A pool row has never carried a genre, so
-- there is nothing to migrate from.
ALTER TABLE "pool_tracks" ADD COLUMN "genres" TEXT[] DEFAULT ARRAY[]::TEXT[];
