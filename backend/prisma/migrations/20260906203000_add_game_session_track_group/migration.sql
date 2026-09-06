-- Null on every existing row: a pool round stored the same sentinel playlist id
-- for every group, so which group it drew from is not recoverable.
ALTER TABLE "game_sessions" ADD COLUMN "track_group_id" TEXT;
