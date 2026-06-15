/*
  Warnings:

  - You are about to drop the column `packetChoices` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "packetChoices";

-- CreateTable
CREATE TABLE "order_item_packet_choices" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT,
    "section" TEXT,
    "choiceItemId" INTEGER,
    "quantity" INTEGER DEFAULT 1,
    "productionStationId" INTEGER,

    CONSTRAINT "order_item_packet_choices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order_item_packet_choices" ADD CONSTRAINT "order_item_packet_choices_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_packet_choices" ADD CONSTRAINT "order_item_packet_choices_choiceItemId_fkey" FOREIGN KEY ("choiceItemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_packet_choices" ADD CONSTRAINT "order_item_packet_choices_productionStationId_fkey" FOREIGN KEY ("productionStationId") REFERENCES "production_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
