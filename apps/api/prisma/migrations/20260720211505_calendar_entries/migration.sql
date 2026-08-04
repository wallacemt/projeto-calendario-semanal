-- CreateEnum
CREATE TYPE "Season" AS ENUM ('WINTER', 'SPRING', 'SUMMER', 'FALL');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN', 'BACKLOG');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PLANNED', 'WATCHING', 'PAUSED', 'COMPLETED', 'DROPPED');

-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "season" "Season" NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEntry" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "animeId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "position" INTEGER NOT NULL,
    "currentEpisode" INTEGER NOT NULL DEFAULT 0,
    "totalEpisodes" INTEGER,
    "status" "EntryStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_userId_season_year_key" ON "Calendar"("userId", "season", "year");

-- CreateIndex
CREATE INDEX "CalendarEntry_calendarId_weekday_position_idx" ON "CalendarEntry"("calendarId", "weekday", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntry_calendarId_animeId_key" ON "CalendarEntry"("calendarId", "animeId");

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEntry" ADD CONSTRAINT "CalendarEntry_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
