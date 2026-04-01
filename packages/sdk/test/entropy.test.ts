import { describe, expect, test } from "bun:test";
import { shannonEntropy } from "../src/entropy.js";
import { IKI_BIN_COUNT } from "../src/types.js";

describe("shannonEntropy", () => {
  test("returns 0 for empty histogram", () => {
    const h = new Float64Array(IKI_BIN_COUNT);
    expect(shannonEntropy(h)).toBe(0);
  });

  test("returns 0 for single-bin histogram", () => {
    const h = new Float64Array(IKI_BIN_COUNT);
    h[5] = 100;
    expect(shannonEntropy(h)).toBe(0);
  });

  test("returns 1 bit for two equally populated bins", () => {
    const h = new Float64Array(IKI_BIN_COUNT);
    h[0] = 50;
    h[1] = 50;
    expect(shannonEntropy(h)).toBeCloseTo(1.0, 10);
  });

  test("returns 2 bits for four equally populated bins", () => {
    const h = new Float64Array(IKI_BIN_COUNT);
    h[0] = 25;
    h[1] = 25;
    h[2] = 25;
    h[3] = 25;
    expect(shannonEntropy(h)).toBeCloseTo(2.0, 10);
  });

  test("returns log2(100) for uniform distribution across all bins", () => {
    const h = new Float64Array(IKI_BIN_COUNT);
    h.fill(1);
    expect(shannonEntropy(h)).toBeCloseTo(Math.log2(100), 10);
  });

  test("skewed distribution has lower entropy than uniform", () => {
    const uniform = new Float64Array(IKI_BIN_COUNT);
    uniform.fill(1);

    const skewed = new Float64Array(IKI_BIN_COUNT);
    skewed[0] = 90;
    skewed[1] = 10;

    expect(shannonEntropy(skewed)).toBeLessThan(shannonEntropy(uniform));
  });

  test("entropy increases with more populated bins", () => {
    const h2 = new Float64Array(IKI_BIN_COUNT);
    h2[0] = 50;
    h2[1] = 50;

    const h4 = new Float64Array(IKI_BIN_COUNT);
    h4[0] = 25;
    h4[1] = 25;
    h4[2] = 25;
    h4[3] = 25;

    expect(shannonEntropy(h4)).toBeGreaterThan(shannonEntropy(h2));
  });
});
