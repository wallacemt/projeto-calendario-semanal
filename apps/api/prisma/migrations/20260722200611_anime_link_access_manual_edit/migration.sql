-- AlterTable
ALTER TABLE "Anime" ADD COLUMN     "linkAccess" TEXT,
ADD COLUMN     "manuallyEdited" BOOLEAN NOT NULL DEFAULT false;
