// Which TanStack Query caches a realtime push must refresh. Order and table
// events refresh the "orders" family too (open bill per table, bill detail,
// orders list): without that, a second terminal that changed a bill left the
// first terminal showing a stale or missing order for the table.
export function realtimeInvalidations(event: string, branchId: string): string[][] {
  switch (event) {
    case "notification.created":
      return [["notifications"]];
    case "kot.created":
    case "kot.updated":
      return [["kds"], ["dashboard"], ["orders"]];
    case "kot.reprinted":
      return [["kds"], ["orders"]];
    case "table.updated":
    case "table.layout.updated":
    case "table.deleted":
      return [["floors", branchId], ["orders"]];
    case "table.request":
      return [["table-requests", branchId]];
    case "waitlist.created":
      return [["waitlist", branchId]];
    case "waitlist.updated":
      return [["waitlist", branchId], ["floors", branchId]];
    case "order.created":
    case "order.updated":
    case "order.deleted":
      // ["kds"]: incoming orders waiting to be accepted, and tickets that a
      // cancel/decline/payment changed, live on the kitchen screen too.
      return [["dashboard"], ["floors", branchId], ["orders"], ["kds"]];
    case "reservation.created":
    case "reservation.updated":
      return [["reservations", branchId], ["dashboard"]];
    default:
      return [];
  }
}

export const REALTIME_EVENTS = [
  "notification.created",
  "kot.created",
  "kot.updated",
  "kot.reprinted",
  "table.updated",
  "table.layout.updated",
  "table.deleted",
  "table.request",
  "waitlist.created",
  "waitlist.updated",
  "order.created",
  "order.updated",
  "order.deleted",
  "reservation.created",
  "reservation.updated",
] as const;
