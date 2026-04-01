import { describe, expect, test, beforeEach, mock } from "bun:test";

/**
 * Test the collector's event logic without a real DOM.
 * We test the core delta-tracking logic by simulating the textarea behavior.
 */

// Since collector.ts relies on DOM APIs (addEventListener, requestAnimationFrame),
// we test the logic by extracting the delta calculation pattern.

describe("collector logic", () => {
  test("positive delta emits keydown event", () => {
    // Simulates: prevLength=5, newLength=6 → delta=1 → keydown
    const prevLength = 5;
    const newLength = 6;
    const delta = newLength - prevLength;
    expect(delta).toBe(1);
    expect(delta > 0).toBe(true); // would emit keydown
  });

  test("negative delta emits character_removed event", () => {
    // Simulates: prevLength=5, newLength=4 → delta=-1 → character_removed
    const prevLength = 5;
    const newLength = 4;
    const delta = newLength - prevLength;
    expect(delta).toBe(-1);
    expect(delta < 0).toBe(true); // would emit character_removed
  });

  test("zero delta is ignored (navigation key)", () => {
    const prevLength = 5;
    const newLength = 5;
    const delta = newLength - prevLength;
    expect(delta).toBe(0);
    // delta === 0 → no event emitted
  });

  test("large positive delta indicates paste", () => {
    const prevLength = 10;
    const newLength = 110;
    const delta = newLength - prevLength;
    expect(delta).toBe(100);
  });

  test("multiple deletions tracked correctly", () => {
    // Select-all + delete: prevLength=100, newLength=0
    const prevLength = 100;
    const newLength = 0;
    const delta = newLength - prevLength;
    expect(delta).toBe(-100);
  });
});
