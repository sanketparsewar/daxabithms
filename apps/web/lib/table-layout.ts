export interface PositionedBox {
  posX: number;
  posY: number;
  width: number;
  height: number;
}

/**
 * Checks if two bounding boxes overlap, accounting for a minimum safety buffer/padding.
 */
export function isOverlapping(
  boxA: PositionedBox,
  boxB: PositionedBox,
  padding = 10,
): boolean {
  return !(
    boxA.posX + boxA.width + padding <= boxB.posX ||
    boxA.posX >= boxB.posX + boxB.width + padding ||
    boxA.posY + boxA.height + padding <= boxB.posY ||
    boxA.posY >= boxB.posY + boxB.height + padding
  );
}

/**
 * Finds the next available non-overlapping grid position for a table on the floor.
 *
 * @param existingTables Tables already placed on the floor
 * @param width Width of the new table (default 80)
 * @param height Height of the new table (default 80)
 * @param cols Number of columns per row before wrapping (default 5)
 * @param startX Left margin (default 20)
 * @param startY Top margin (default 20)
 * @param gap Spacing between tables (default 40)
 */
export function findNextAvailableTablePosition(
  existingTables: PositionedBox[],
  width = 80,
  height = 80,
  cols = 5,
  startX = 20,
  startY = 20,
  gap = 40,
): { posX: number; posY: number } {
  if (!existingTables || existingTables.length === 0) {
    return { posX: startX, posY: startY };
  }

  const stepX = width + gap;
  const stepY = height + gap;

  // Search through grid slots in row-major order
  for (let slot = 0; slot < 500; slot++) {
    const col = slot % cols;
    const row = Math.floor(slot / cols);
    const candidate: PositionedBox = {
      posX: startX + col * stepX,
      posY: startY + row * stepY,
      width,
      height,
    };

    const collides = existingTables.some((t) => isOverlapping(candidate, t, 10));

    if (!collides) {
      return { posX: candidate.posX, posY: candidate.posY };
    }
  }

  // Fallback: place below the lowest existing table
  const maxBottom = existingTables.reduce(
    (max, t) => Math.max(max, t.posY + t.height),
    startY,
  );
  return { posX: startX, posY: maxBottom + gap };
}
