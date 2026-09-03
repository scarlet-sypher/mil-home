-- AlterTable
-- Backfill existing rows with a temporary default, then drop it so the column
-- matches the schema (NOT NULL, no default) going forward.
ALTER TABLE "users" ADD COLUMN     "username" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ALTER COLUMN "username" DROP DEFAULT;
