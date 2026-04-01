import type { IKIHistogram } from "./types.js";

/**
 * Calculate Shannon entropy over an IKI histogram.
 *
 * H = -sum(p_i * log2(p_i)) for all bins where p_i > 0.
 *
 * Returns entropy in bits. Higher entropy = more varied typing rhythm.
 * Returns 0 if histogram is empty or has only one occupied bin.
 */
export function shannonEntropy(histogram: IKIHistogram): number {
  let total = 0;
  for (let i = 0; i < histogram.length; i++) {
    total += histogram[i];
  }

  if (total <= 0) return 0;

  let entropy = 0;
  for (let i = 0; i < histogram.length; i++) {
    if (histogram[i] > 0) {
      const p = histogram[i] / total;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}
