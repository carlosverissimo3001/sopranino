-- The flag never meant "special", it meant "only reachable through its group".
-- Country charts need the same rule, so the name is now the rule.
ALTER TABLE "pool_tracks" RENAME COLUMN "special" TO "group_only";
ALTER INDEX "pool_tracks_special_idx" RENAME TO "pool_tracks_group_only_idx";
