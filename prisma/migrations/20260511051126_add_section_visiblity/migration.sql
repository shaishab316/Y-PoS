-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "isVisible" BOOLEAN DEFAULT true,
ADD COLUMN     "orientationKiosk" "Orientation" DEFAULT 'LANDSCAPE',
ADD COLUMN     "orientationService" "Orientation" DEFAULT 'PORTRAIT',
ADD COLUMN     "visibleOnAdmin" BOOLEAN DEFAULT true,
ADD COLUMN     "visibleOnQrTable" BOOLEAN DEFAULT true,
ADD COLUMN     "visibleOnService" BOOLEAN DEFAULT true,
ADD COLUMN     "visibleOnTouchscreen" BOOLEAN DEFAULT true;
