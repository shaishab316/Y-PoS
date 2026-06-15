/*
  Warnings:

  - You are about to drop the column `name` on the `packet_section_choices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "packet_section_choices" DROP COLUMN "name",
ADD COLUMN     "itemId" INTEGER;

-- AddForeignKey
ALTER TABLE "packet_section_choices" ADD CONSTRAINT "packet_section_choices_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
