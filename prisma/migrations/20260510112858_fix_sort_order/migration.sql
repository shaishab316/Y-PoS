-- AlterTable
CREATE SEQUENCE global_charges_sortorder_seq;
ALTER TABLE "global_charges" ALTER COLUMN "sortOrder" SET DEFAULT nextval('global_charges_sortorder_seq');
ALTER SEQUENCE global_charges_sortorder_seq OWNED BY "global_charges"."sortOrder";

-- AlterTable
CREATE SEQUENCE menus_sortorder_seq;
ALTER TABLE "menus" ALTER COLUMN "sortOrder" SET DEFAULT nextval('menus_sortorder_seq');
ALTER SEQUENCE menus_sortorder_seq OWNED BY "menus"."sortOrder";

-- AlterTable
CREATE SEQUENCE packet_section_choices_sortorder_seq;
ALTER TABLE "packet_section_choices" ALTER COLUMN "sortOrder" SET DEFAULT nextval('packet_section_choices_sortorder_seq');
ALTER SEQUENCE packet_section_choices_sortorder_seq OWNED BY "packet_section_choices"."sortOrder";

-- AlterTable
CREATE SEQUENCE packet_sections_sortorder_seq;
ALTER TABLE "packet_sections" ALTER COLUMN "sortOrder" SET DEFAULT nextval('packet_sections_sortorder_seq');
ALTER SEQUENCE packet_sections_sortorder_seq OWNED BY "packet_sections"."sortOrder";

-- AlterTable
CREATE SEQUENCE production_stations_sortorder_seq;
ALTER TABLE "production_stations" ALTER COLUMN "sortOrder" SET DEFAULT nextval('production_stations_sortorder_seq');
ALTER SEQUENCE production_stations_sortorder_seq OWNED BY "production_stations"."sortOrder";

-- AlterTable
CREATE SEQUENCE section_items_sortorder_seq;
ALTER TABLE "section_items" ALTER COLUMN "sortOrder" SET DEFAULT nextval('section_items_sortorder_seq');
ALTER SEQUENCE section_items_sortorder_seq OWNED BY "section_items"."sortOrder";

-- AlterTable
CREATE SEQUENCE sections_sortorder_seq;
ALTER TABLE "sections" ALTER COLUMN "sortOrder" SET DEFAULT nextval('sections_sortorder_seq');
ALTER SEQUENCE sections_sortorder_seq OWNED BY "sections"."sortOrder";
