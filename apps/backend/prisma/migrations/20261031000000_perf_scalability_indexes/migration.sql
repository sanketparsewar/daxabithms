-- CreateIndex
CREATE INDEX "customers_branchId_createdAt_idx" ON "customers"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_branchId_status_billedAt_idx" ON "orders"("branchId", "status", "billedAt");

-- CreateIndex
CREATE INDEX "order_items_menuItemId_idx" ON "order_items"("menuItemId");

