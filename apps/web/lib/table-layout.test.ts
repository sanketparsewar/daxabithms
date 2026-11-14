import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findNextAvailableTablePosition, isOverlapping } from "./table-layout.ts";

describe("table-layout", () => {
  it("places the first table at default starting coordinates", () => {
    const pos = findNextAvailableTablePosition([], 80, 80);
    assert.deepEqual(pos, { posX: 20, posY: 20 });
  });

  it("places the second table next to the first without overlapping", () => {
    const existing = [{ posX: 20, posY: 20, width: 80, height: 80 }];
    const pos = findNextAvailableTablePosition(existing, 80, 80);
    // col 1: 20 + 1 * 120 = 140
    assert.deepEqual(pos, { posX: 140, posY: 20 });
  });

  it("wraps to the next row when the first row is full", () => {
    const existing = [
      { posX: 20, posY: 20, width: 80, height: 80 },
      { posX: 140, posY: 20, width: 80, height: 80 },
      { posX: 260, posY: 20, width: 80, height: 80 },
      { posX: 380, posY: 20, width: 80, height: 80 },
      { posX: 500, posY: 20, width: 80, height: 80 },
    ];
    const pos = findNextAvailableTablePosition(existing, 80, 80, 5);
    // Row 1, Col 0: x: 20, y: 20 + 120 = 140
    assert.deepEqual(pos, { posX: 20, posY: 140 });
  });

  it("skips occupied slots and finds holes in the grid", () => {
    const existing = [
      { posX: 20, posY: 20, width: 80, height: 80 },
      // slot (140, 20) is free!
      { posX: 260, posY: 20, width: 80, height: 80 },
    ];
    const pos = findNextAvailableTablePosition(existing, 80, 80);
    assert.deepEqual(pos, { posX: 140, posY: 20 });
  });

  it("correctly identifies overlapping vs non-overlapping boxes", () => {
    const boxA = { posX: 20, posY: 20, width: 80, height: 80 };
    const overlappingBox = { posX: 50, posY: 50, width: 80, height: 80 };
    const clearBox = { posX: 140, posY: 20, width: 80, height: 80 };

    assert.equal(isOverlapping(boxA, overlappingBox), true);
    assert.equal(isOverlapping(boxA, clearBox), false);
  });
});
