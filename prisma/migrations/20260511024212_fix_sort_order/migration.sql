-- AlterTable
ALTER TABLE "global_charges" ALTER COLUMN "sortOrder" DROP NOT NULL,
ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "menus" ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "packet_section_choices" ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "packet_sections" ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "production_stations" ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "section_items" ALTER COLUMN "sortOrder" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sections" ALTER COLUMN "sortOrder" DROP DEFAULT;
