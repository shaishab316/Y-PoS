-- AlterTable
ALTER TABLE "users" ADD COLUMN     "productionStationId" INTEGER;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_productionStationId_fkey" FOREIGN KEY ("productionStationId") REFERENCES "production_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
