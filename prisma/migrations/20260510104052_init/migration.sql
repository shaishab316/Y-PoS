-- CreateEnum
CREATE TYPE "Layout" AS ENUM ('SINGLE', 'DOUBLE', 'TRIPLE', 'QUADRUPLE', 'LIST_WITH_IMAGE', 'LIST_NO_IMAGE');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'PICKED_UP', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('QR_TABLE', 'TOUCHSCREEN', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemLabel" AS ENUM ('BEST_SELLER', 'RECOMMENDED', 'FAVORITE', 'MUST_TRY', 'NEW', 'VEGETARIAN', 'KIDS_CHOICE', 'SPICY');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('INDIVIDUAL', 'PACKET');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Orientation" AS ENUM ('LANDSCAPE', 'PORTRAIT');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('OPENING', 'CLOSING');

-- CreateEnum
CREATE TYPE "NotificationEvent" AS ENUM ('ORDER_RECEIVED', 'ITEM_READY', 'ITEM_PICKED_UP', 'MANUAL_REMIND', 'ITEM_CANCELLED');

-- CreateTable
CREATE TABLE "business_profiles" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "email" TEXT,
    "socialMedia" TEXT,
    "logoUrl" TEXT,
    "customNote" TEXT,
    "passwordRecoveryEmail" TEXT,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operating_hours" (
    "id" SERIAL NOT NULL,
    "businessProfileId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER DEFAULT 0,
    "openTime1" TEXT,
    "closeTime1" TEXT,
    "openTime2" TEXT,
    "closeTime2" TEXT,

    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" SERIAL NOT NULL,
    "businessProfileId" INTEGER NOT NULL,
    "date" DATE,
    "description" TEXT,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_charges" (
    "id" SERIAL NOT NULL,
    "businessProfileId" INTEGER NOT NULL,
    "name" TEXT,
    "rate" DECIMAL(5,2) NOT NULL,
    "isPercent" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "global_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_logs" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "itemId" INTEGER,
    "itemName" TEXT,
    "date" DATE,
    "openingStock" INTEGER DEFAULT 0,
    "stockSold" INTEGER DEFAULT 0,
    "stockIn" INTEGER DEFAULT 0,
    "stockOut" INTEGER DEFAULT 0,
    "closingStock" INTEGER DEFAULT 0,
    "remarks" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "itemType" "ItemType" DEFAULT 'INDIVIDUAL',
    "price" DECIMAL(10,2) DEFAULT 0.00,
    "productionStationId" INTEGER,
    "inventoryQty" INTEGER,
    "labels" "ItemLabel"[],
    "imageUrl" TEXT,
    "isVisible" BOOLEAN DEFAULT true,
    "isOutOfStock" BOOLEAN DEFAULT false,
    "hasPromo" BOOLEAN DEFAULT false,
    "promoName" TEXT,
    "promoPrice" DECIMAL(10,2),
    "maxPacketItems" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packet_sections" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "itemId" INTEGER,
    "name" TEXT,
    "maxQty" INTEGER DEFAULT 1,
    "sortOrder" INTEGER DEFAULT 0,

    CONSTRAINT "packet_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packet_section_choices" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "packetSectionId" INTEGER,
    "name" TEXT,
    "maxQty" INTEGER DEFAULT 1,
    "sortOrder" INTEGER DEFAULT 0,

    CONSTRAINT "packet_section_choices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "coverImageUrl" TEXT,
    "isVisible" BOOLEAN DEFAULT true,
    "visibleOnQrTable" BOOLEAN DEFAULT true,
    "visibleOnTouchscreen" BOOLEAN DEFAULT true,
    "visibleOnService" BOOLEAN DEFAULT true,
    "visibleOnAdmin" BOOLEAN DEFAULT true,
    "orientationKiosk" "Orientation" DEFAULT 'LANDSCAPE',
    "orientationService" "Orientation" DEFAULT 'PORTRAIT',
    "sortOrder" INTEGER DEFAULT 0,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER,
    "orderItemId" INTEGER,
    "event" "NotificationEvent",
    "isMuted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "source" "OrderSource",
    "type" "OrderType" DEFAULT 'DINE_IN',
    "status" "OrderStatus" DEFAULT 'PENDING',
    "customerName" TEXT,
    "tableId" INTEGER,
    "assignedToId" INTEGER,
    "subtotal" DECIMAL(10,2) DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2) DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER,
    "itemId" INTEGER,
    "productionStationId" INTEGER,
    "itemName" TEXT,
    "unitPrice" DECIMAL(10,2),
    "promoPrice" DECIMAL(10,2),
    "quantity" INTEGER DEFAULT 1,
    "status" "OrderStatus" DEFAULT 'PENDING',
    "packetChoices" JSONB,
    "isCancelled" BOOLEAN DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancelReviewedBy" INTEGER,
    "processedAt" TIMESTAMP(3),
    "readyAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "orderId" INTEGER,
    "method" "PaymentMethod" DEFAULT 'CASH',
    "status" "PaymentStatus" DEFAULT 'PENDING',
    "subtotal" DECIMAL(10,2),
    "chargesTotal" DECIMAL(10,2) DEFAULT 0.00,
    "totalAmount" DECIMAL(10,2),
    "cashReceived" DECIMAL(10,2),
    "changeAmount" DECIMAL(10,2),
    "proofImageUrl" TEXT,
    "appliedCharges" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_stations" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "sortOrder" INTEGER DEFAULT 0,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "production_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "layout" "Layout" DEFAULT 'SINGLE',
    "sortOrder" INTEGER DEFAULT 0,
    "menuId" INTEGER,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_items" (
    "id" TEXT NOT NULL,
    "sectionId" INTEGER,
    "itemId" INTEGER,
    "sortOrder" INTEGER DEFAULT 0,

    CONSTRAINT "section_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "type" "ShiftType",
    "inventoryAccurate" BOOLEAN,
    "promotionConfirmed" BOOLEAN,
    "openingCashAmount" DECIMAL(10,2),
    "closingCashAmount" DECIMAL(10,2),
    "closingDiscrepancy" DECIMAL(10,2),
    "salesConfirmed" BOOLEAN,
    "skippedInventory" BOOLEAN DEFAULT false,
    "skippedPromotion" BOOLEAN DEFAULT false,
    "skippedCash" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_proofs" (
    "id" TEXT NOT NULL,
    "shiftSessionId" TEXT,
    "imageUrl" TEXT,
    "uploadedById" INTEGER,
    "verifiedById" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "tableNumber" INTEGER,
    "qrCode" TEXT,
    "isActive" BOOLEAN DEFAULT true,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "role" "UserRole" DEFAULT 'ADMIN',
    "passwordHash" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_charges" ADD CONSTRAINT "global_charges_businessProfileId_fkey" FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_productionStationId_fkey" FOREIGN KEY ("productionStationId") REFERENCES "production_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packet_sections" ADD CONSTRAINT "packet_sections_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packet_section_choices" ADD CONSTRAINT "packet_section_choices_packetSectionId_fkey" FOREIGN KEY ("packetSectionId") REFERENCES "packet_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productionStationId_fkey" FOREIGN KEY ("productionStationId") REFERENCES "production_stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_items" ADD CONSTRAINT "section_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_proofs" ADD CONSTRAINT "cash_proofs_shiftSessionId_fkey" FOREIGN KEY ("shiftSessionId") REFERENCES "shift_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_proofs" ADD CONSTRAINT "cash_proofs_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
