-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_itemId_fkey";

-- DropForeignKey
ALTER TABLE "shift_sessions" DROP CONSTRAINT "shift_sessions_userId_fkey";

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_sessions" ADD CONSTRAINT "shift_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
