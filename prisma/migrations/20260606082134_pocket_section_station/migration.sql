-- AlterTable
ALTER TABLE "packet_sections" ADD COLUMN     "productionStationId" INTEGER;

-- AddForeignKey
ALTER TABLE "packet_sections" ADD CONSTRAINT "packet_sections_productionStationId_fkey" FOREIGN KEY ("productionStationId") REFERENCES "production_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
