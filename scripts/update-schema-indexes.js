const fs = require('fs');

let schema = fs.readFileSync('apps/backend/prisma/schema.prisma', 'utf8');

// 1. Customer index: [branchId, createdAt]
const customerTarget = '  @@index([branchId, phone])\r\n  @@map("customers")';
const customerTargetLf = '  @@index([branchId, phone])\n  @@map("customers")';
const customerRepl = '  @@index([branchId, phone])\r\n  @@index([branchId, createdAt])\r\n  @@map("customers")';

if (schema.includes(customerTarget)) {
  schema = schema.replace(customerTarget, customerRepl);
  console.log('Customer index updated (CRLF)');
} else if (schema.includes(customerTargetLf)) {
  schema = schema.replace(customerTargetLf, customerRepl.replace(/\r\n/g, '\n'));
  console.log('Customer index updated (LF)');
} else {
  console.log('Customer target not found');
}

// 2. Order index: [branchId, status, billedAt]
const orderTarget = '  @@index([branchId, status])\r\n  @@index([branchId, deliveryStatus])';
const orderTargetLf = '  @@index([branchId, status])\n  @@index([branchId, deliveryStatus])';
const orderRepl = '  @@index([branchId, status])\r\n  @@index([branchId, status, billedAt])\r\n  @@index([branchId, deliveryStatus])';

if (schema.includes(orderTarget)) {
  schema = schema.replace(orderTarget, orderRepl);
  console.log('Order index updated (CRLF)');
} else if (schema.includes(orderTargetLf)) {
  schema = schema.replace(orderTargetLf, orderRepl.replace(/\r\n/g, '\n'));
  console.log('Order index updated (LF)');
} else {
  console.log('Order target not found');
}

// 3. OrderItem index: [menuItemId]
const itemTarget = '  @@index([orderId])\r\n  @@map("order_items")';
const itemTargetLf = '  @@index([orderId])\n  @@map("order_items")';
const itemRepl = '  @@index([orderId])\r\n  @@index([menuItemId])\r\n  @@map("order_items")';

if (schema.includes(itemTarget)) {
  schema = schema.replace(itemTarget, itemRepl);
  console.log('OrderItem index updated (CRLF)');
} else if (schema.includes(itemTargetLf)) {
  schema = schema.replace(itemTargetLf, itemRepl.replace(/\r\n/g, '\n'));
  console.log('OrderItem index updated (LF)');
} else {
  console.log('OrderItem target not found');
}

fs.writeFileSync('apps/backend/prisma/schema.prisma', schema);
console.log('Saved schema.prisma');

