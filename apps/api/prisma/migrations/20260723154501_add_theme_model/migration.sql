-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activeThemeId" TEXT;

-- CreateTable
CREATE TABLE "Theme" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accent" TEXT NOT NULL,
    "accent2" TEXT NOT NULL,
    "bgImageUrl" TEXT,
    "season" "Season",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Theme_userId_idx" ON "Theme"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Theme_userId_season_key" ON "Theme"("userId", "season");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_activeThemeId_fkey" FOREIGN KEY ("activeThemeId") REFERENCES "Theme"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
