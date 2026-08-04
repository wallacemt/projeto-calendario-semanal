-- CreateTable
CREATE TABLE "Anime" (
    "id" TEXT NOT NULL,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "synopsis" TEXT,
    "episodes" INTEGER,
    "genres" JSONB,
    "malUrl" TEXT,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Anime_malId_key" ON "Anime"("malId");
