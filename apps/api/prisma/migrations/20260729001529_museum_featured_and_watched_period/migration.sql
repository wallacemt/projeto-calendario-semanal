-- AlterTable
ALTER TABLE "User" ADD COLUMN     "featuredWatchedAnimeId" TEXT;

-- AlterTable
ALTER TABLE "WatchedAnime" ADD COLUMN     "watchedSeason" "Season",
ADD COLUMN     "watchedYear" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_featuredWatchedAnimeId_fkey" FOREIGN KEY ("featuredWatchedAnimeId") REFERENCES "WatchedAnime"("id") ON DELETE SET NULL ON UPDATE CASCADE;
