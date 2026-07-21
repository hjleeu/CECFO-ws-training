/*
  Warnings:

  - You are about to drop the column `subtitle` on the `Song` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Song` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Song" DROP COLUMN "subtitle",
ADD COLUMN     "album" TEXT,
ADD COLUMN     "artist" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Song_slug_key" ON "Song"("slug");
