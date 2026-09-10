-- A room browsable by strangers needs a name of its own, so a public list
-- never has to publish the host's display name.
ALTER TABLE "multiplayer_rooms" ADD COLUMN "name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "multiplayer_rooms" ADD COLUMN "findable" BOOLEAN NOT NULL DEFAULT true;

-- Rooms that predate the column. Only WAITING ones can ever be listed, and
-- the invite code is already theirs, so it stands in until they expire.
UPDATE "multiplayer_rooms" SET "name" = 'Room ' || "invite_code" WHERE "name" = '';

ALTER TABLE "multiplayer_rooms" ALTER COLUMN "name" DROP DEFAULT;

CREATE INDEX "multiplayer_rooms_findable_status_idx" ON "multiplayer_rooms"("findable", "status");
