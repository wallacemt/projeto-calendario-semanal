-- CreateTable
CREATE TABLE "WatchedAnime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchedAnime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WatchedAnime_userId_completedAt_idx" ON "WatchedAnime"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WatchedAnime_userId_animeId_key" ON "WatchedAnime"("userId", "animeId");

-- AddForeignKey
ALTER TABLE "WatchedAnime" ADD CONSTRAINT "WatchedAnime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchedAnime" ADD CONSTRAINT "WatchedAnime_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
