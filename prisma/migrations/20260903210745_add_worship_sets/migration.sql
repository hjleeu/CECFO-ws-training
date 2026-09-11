-- CreateTable
CREATE TABLE "WorshipSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorshipSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorshipSetSong" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "worshipSetId" TEXT NOT NULL,
    "songSlug" TEXT NOT NULL,

    CONSTRAINT "WorshipSetSong_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorshipSetSong_worshipSetId_songSlug_key" ON "WorshipSetSong"("worshipSetId", "songSlug");

-- CreateIndex
CREATE UNIQUE INDEX "WorshipSetSong_worshipSetId_order_key" ON "WorshipSetSong"("worshipSetId", "order");

-- AddForeignKey
ALTER TABLE "WorshipSetSong" ADD CONSTRAINT "WorshipSetSong_worshipSetId_fkey" FOREIGN KEY ("worshipSetId") REFERENCES "WorshipSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorshipSetSong" ADD CONSTRAINT "WorshipSetSong_songSlug_fkey" FOREIGN KEY ("songSlug") REFERENCES "Song"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
