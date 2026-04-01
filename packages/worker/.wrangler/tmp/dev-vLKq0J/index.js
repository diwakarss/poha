var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../node_modules/.bun/@noble+ed25519@2.3.0/node_modules/@noble/ed25519/index.js
var ed25519_CURVE = {
  p: 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffedn,
  n: 0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3edn,
  h: 8n,
  a: 0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffecn,
  d: 0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3n,
  Gx: 0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51an,
  Gy: 0x6666666666666666666666666666666666666666666666666666666666666658n
};
var { p: P, n: N, Gx, Gy, a: _a, d: _d } = ed25519_CURVE;
var h = 8n;
var L = 32;
var L2 = 64;
var err = /* @__PURE__ */ __name((m = "") => {
  throw new Error(m);
}, "err");
var isBig = /* @__PURE__ */ __name((n) => typeof n === "bigint", "isBig");
var isStr = /* @__PURE__ */ __name((s) => typeof s === "string", "isStr");
var isBytes = /* @__PURE__ */ __name((a) => a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array", "isBytes");
var abytes = /* @__PURE__ */ __name((a, l) => !isBytes(a) || typeof l === "number" && l > 0 && a.length !== l ? err("Uint8Array expected") : a, "abytes");
var u8n = /* @__PURE__ */ __name((len) => new Uint8Array(len), "u8n");
var u8fr = /* @__PURE__ */ __name((buf) => Uint8Array.from(buf), "u8fr");
var padh = /* @__PURE__ */ __name((n, pad) => n.toString(16).padStart(pad, "0"), "padh");
var bytesToHex = /* @__PURE__ */ __name((b) => Array.from(abytes(b)).map((e) => padh(e, 2)).join(""), "bytesToHex");
var C = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
var _ch = /* @__PURE__ */ __name((ch) => {
  if (ch >= C._0 && ch <= C._9)
    return ch - C._0;
  if (ch >= C.A && ch <= C.F)
    return ch - (C.A - 10);
  if (ch >= C.a && ch <= C.f)
    return ch - (C.a - 10);
  return;
}, "_ch");
var hexToBytes = /* @__PURE__ */ __name((hex) => {
  const e = "hex invalid";
  if (!isStr(hex))
    return err(e);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    return err(e);
  const array = u8n(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = _ch(hex.charCodeAt(hi));
    const n2 = _ch(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0)
      return err(e);
    array[ai] = n1 * 16 + n2;
  }
  return array;
}, "hexToBytes");
var toU8 = /* @__PURE__ */ __name((a, len) => abytes(isStr(a) ? hexToBytes(a) : u8fr(abytes(a)), len), "toU8");
var cr = /* @__PURE__ */ __name(() => globalThis?.crypto, "cr");
var subtle = /* @__PURE__ */ __name(() => cr()?.subtle ?? err("crypto.subtle must be defined"), "subtle");
var concatBytes = /* @__PURE__ */ __name((...arrs) => {
  const r = u8n(arrs.reduce((sum, a) => sum + abytes(a).length, 0));
  let pad = 0;
  arrs.forEach((a) => {
    r.set(a, pad);
    pad += a.length;
  });
  return r;
}, "concatBytes");
var randomBytes = /* @__PURE__ */ __name((len = L) => {
  const c = cr();
  return c.getRandomValues(u8n(len));
}, "randomBytes");
var big = BigInt;
var arange = /* @__PURE__ */ __name((n, min, max, msg = "bad number: out of range") => isBig(n) && min <= n && n < max ? n : err(msg), "arange");
var M = /* @__PURE__ */ __name((a, b = P) => {
  const r = a % b;
  return r >= 0n ? r : b + r;
}, "M");
var modN = /* @__PURE__ */ __name((a) => M(a, N), "modN");
var invert = /* @__PURE__ */ __name((num, md) => {
  if (num === 0n || md <= 0n)
    err("no inverse n=" + num + " mod=" + md);
  let a = M(num, md), b = md, x = 0n, y = 1n, u = 1n, v = 0n;
  while (a !== 0n) {
    const q = b / a, r = b % a;
    const m = x - u * q, n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  return b === 1n ? M(x, md) : err("no inverse");
}, "invert");
var apoint = /* @__PURE__ */ __name((p) => p instanceof Point ? p : err("Point expected"), "apoint");
var B256 = 2n ** 256n;
var Point = class _Point {
  static {
    __name(this, "Point");
  }
  static BASE;
  static ZERO;
  ex;
  ey;
  ez;
  et;
  constructor(ex, ey, ez, et) {
    const max = B256;
    this.ex = arange(ex, 0n, max);
    this.ey = arange(ey, 0n, max);
    this.ez = arange(ez, 1n, max);
    this.et = arange(et, 0n, max);
    Object.freeze(this);
  }
  static fromAffine(p) {
    return new _Point(p.x, p.y, 1n, M(p.x * p.y));
  }
  /** RFC8032 5.1.3: Uint8Array to Point. */
  static fromBytes(hex, zip215 = false) {
    const d = _d;
    const normed = u8fr(abytes(hex, L));
    const lastByte = hex[31];
    normed[31] = lastByte & ~128;
    const y = bytesToNumLE(normed);
    const max = zip215 ? B256 : P;
    arange(y, 0n, max);
    const y2 = M(y * y);
    const u = M(y2 - 1n);
    const v = M(d * y2 + 1n);
    let { isValid, value: x } = uvRatio(u, v);
    if (!isValid)
      err("bad point: y not sqrt");
    const isXOdd = (x & 1n) === 1n;
    const isLastByteOdd = (lastByte & 128) !== 0;
    if (!zip215 && x === 0n && isLastByteOdd)
      err("bad point: x==0, isLastByteOdd");
    if (isLastByteOdd !== isXOdd)
      x = M(-x);
    return new _Point(x, y, 1n, M(x * y));
  }
  /** Checks if the point is valid and on-curve. */
  assertValidity() {
    const a = _a;
    const d = _d;
    const p = this;
    if (p.is0())
      throw new Error("bad point: ZERO");
    const { ex: X, ey: Y, ez: Z, et: T } = p;
    const X2 = M(X * X);
    const Y2 = M(Y * Y);
    const Z2 = M(Z * Z);
    const Z4 = M(Z2 * Z2);
    const aX2 = M(X2 * a);
    const left = M(Z2 * M(aX2 + Y2));
    const right = M(Z4 + M(d * M(X2 * Y2)));
    if (left !== right)
      throw new Error("bad point: equation left != right (1)");
    const XY = M(X * Y);
    const ZT = M(Z * T);
    if (XY !== ZT)
      throw new Error("bad point: equation left != right (2)");
    return this;
  }
  /** Equality check: compare points P&Q. */
  equals(other) {
    const { ex: X1, ey: Y1, ez: Z1 } = this;
    const { ex: X2, ey: Y2, ez: Z2 } = apoint(other);
    const X1Z2 = M(X1 * Z2);
    const X2Z1 = M(X2 * Z1);
    const Y1Z2 = M(Y1 * Z2);
    const Y2Z1 = M(Y2 * Z1);
    return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
  }
  is0() {
    return this.equals(I);
  }
  /** Flip point over y coordinate. */
  negate() {
    return new _Point(M(-this.ex), this.ey, this.ez, M(-this.et));
  }
  /** Point doubling. Complete formula. Cost: `4M + 4S + 1*a + 6add + 1*2`. */
  double() {
    const { ex: X1, ey: Y1, ez: Z1 } = this;
    const a = _a;
    const A = M(X1 * X1);
    const B = M(Y1 * Y1);
    const C2 = M(2n * M(Z1 * Z1));
    const D = M(a * A);
    const x1y1 = X1 + Y1;
    const E = M(M(x1y1 * x1y1) - A - B);
    const G2 = D + B;
    const F = G2 - C2;
    const H = D - B;
    const X3 = M(E * F);
    const Y3 = M(G2 * H);
    const T3 = M(E * H);
    const Z3 = M(F * G2);
    return new _Point(X3, Y3, Z3, T3);
  }
  /** Point addition. Complete formula. Cost: `8M + 1*k + 8add + 1*2`. */
  add(other) {
    const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
    const { ex: X2, ey: Y2, ez: Z2, et: T2 } = apoint(other);
    const a = _a;
    const d = _d;
    const A = M(X1 * X2);
    const B = M(Y1 * Y2);
    const C2 = M(T1 * d * T2);
    const D = M(Z1 * Z2);
    const E = M((X1 + Y1) * (X2 + Y2) - A - B);
    const F = M(D - C2);
    const G2 = M(D + C2);
    const H = M(B - a * A);
    const X3 = M(E * F);
    const Y3 = M(G2 * H);
    const T3 = M(E * H);
    const Z3 = M(F * G2);
    return new _Point(X3, Y3, Z3, T3);
  }
  /**
   * Point-by-scalar multiplication. Scalar must be in range 1 <= n < CURVE.n.
   * Uses {@link wNAF} for base point.
   * Uses fake point to mitigate side-channel leakage.
   * @param n scalar by which point is multiplied
   * @param safe safe mode guards against timing attacks; unsafe mode is faster
   */
  multiply(n, safe = true) {
    if (!safe && (n === 0n || this.is0()))
      return I;
    arange(n, 1n, N);
    if (n === 1n)
      return this;
    if (this.equals(G))
      return wNAF(n).p;
    let p = I;
    let f = G;
    for (let d = this; n > 0n; d = d.double(), n >>= 1n) {
      if (n & 1n)
        p = p.add(d);
      else if (safe)
        f = f.add(d);
    }
    return p;
  }
  /** Convert point to 2d xy affine point. (X, Y, Z) ∋ (x=X/Z, y=Y/Z) */
  toAffine() {
    const { ex: x, ey: y, ez: z } = this;
    if (this.equals(I))
      return { x: 0n, y: 1n };
    const iz = invert(z, P);
    if (M(z * iz) !== 1n)
      err("invalid inverse");
    return { x: M(x * iz), y: M(y * iz) };
  }
  toBytes() {
    const { x, y } = this.assertValidity().toAffine();
    const b = numTo32bLE(y);
    b[31] |= x & 1n ? 128 : 0;
    return b;
  }
  toHex() {
    return bytesToHex(this.toBytes());
  }
  // encode to hex string
  clearCofactor() {
    return this.multiply(big(h), false);
  }
  isSmallOrder() {
    return this.clearCofactor().is0();
  }
  isTorsionFree() {
    let p = this.multiply(N / 2n, false).double();
    if (N % 2n)
      p = p.add(this);
    return p.is0();
  }
  static fromHex(hex, zip215) {
    return _Point.fromBytes(toU8(hex), zip215);
  }
  get x() {
    return this.toAffine().x;
  }
  get y() {
    return this.toAffine().y;
  }
  toRawBytes() {
    return this.toBytes();
  }
};
var G = new Point(Gx, Gy, 1n, M(Gx * Gy));
var I = new Point(0n, 1n, 1n, 0n);
Point.BASE = G;
Point.ZERO = I;
var numTo32bLE = /* @__PURE__ */ __name((num) => hexToBytes(padh(arange(num, 0n, B256), L2)).reverse(), "numTo32bLE");
var bytesToNumLE = /* @__PURE__ */ __name((b) => big("0x" + bytesToHex(u8fr(abytes(b)).reverse())), "bytesToNumLE");
var pow2 = /* @__PURE__ */ __name((x, power) => {
  let r = x;
  while (power-- > 0n) {
    r *= r;
    r %= P;
  }
  return r;
}, "pow2");
var pow_2_252_3 = /* @__PURE__ */ __name((x) => {
  const x2 = x * x % P;
  const b2 = x2 * x % P;
  const b4 = pow2(b2, 2n) * b2 % P;
  const b5 = pow2(b4, 1n) * x % P;
  const b10 = pow2(b5, 5n) * b5 % P;
  const b20 = pow2(b10, 10n) * b10 % P;
  const b40 = pow2(b20, 20n) * b20 % P;
  const b80 = pow2(b40, 40n) * b40 % P;
  const b160 = pow2(b80, 80n) * b80 % P;
  const b240 = pow2(b160, 80n) * b80 % P;
  const b250 = pow2(b240, 10n) * b10 % P;
  const pow_p_5_8 = pow2(b250, 2n) * x % P;
  return { pow_p_5_8, b2 };
}, "pow_2_252_3");
var RM1 = 0x2b8324804fc1df0b2b4d00993dfbd7a72f431806ad2fe478c4ee1b274a0ea0b0n;
var uvRatio = /* @__PURE__ */ __name((u, v) => {
  const v3 = M(v * v * v);
  const v7 = M(v3 * v3 * v);
  const pow = pow_2_252_3(u * v7).pow_p_5_8;
  let x = M(u * v3 * pow);
  const vx2 = M(v * x * x);
  const root1 = x;
  const root2 = M(x * RM1);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === M(-u);
  const noRoot = vx2 === M(-u * RM1);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if ((M(x) & 1n) === 1n)
    x = M(-x);
  return { isValid: useRoot1 || useRoot2, value: x };
}, "uvRatio");
var modL_LE = /* @__PURE__ */ __name((hash) => modN(bytesToNumLE(hash)), "modL_LE");
var sha512a = /* @__PURE__ */ __name((...m) => etc.sha512Async(...m), "sha512a");
var hashFinishA = /* @__PURE__ */ __name((res) => sha512a(res.hashable).then(res.finish), "hashFinishA");
var veriOpts = { zip215: true };
var _verify = /* @__PURE__ */ __name((sig, msg, pub, opts = veriOpts) => {
  sig = toU8(sig, L2);
  msg = toU8(msg);
  pub = toU8(pub, L);
  const { zip215 } = opts;
  let A;
  let R;
  let s;
  let SB;
  let hashable = Uint8Array.of();
  try {
    A = Point.fromHex(pub, zip215);
    R = Point.fromHex(sig.slice(0, L), zip215);
    s = bytesToNumLE(sig.slice(L, L2));
    SB = G.multiply(s, false);
    hashable = concatBytes(R.toBytes(), A.toBytes(), msg);
  } catch (error) {
  }
  const finish = /* @__PURE__ */ __name((hashed) => {
    if (SB == null)
      return false;
    if (!zip215 && A.isSmallOrder())
      return false;
    const k = modL_LE(hashed);
    const RkA = R.add(A.multiply(k, false));
    return RkA.add(SB.negate()).clearCofactor().is0();
  }, "finish");
  return { hashable, finish };
}, "_verify");
var verifyAsync = /* @__PURE__ */ __name(async (s, m, p, opts = veriOpts) => hashFinishA(_verify(s, m, p, opts)), "verifyAsync");
var etc = {
  sha512Async: /* @__PURE__ */ __name(async (...messages) => {
    const s = subtle();
    const m = concatBytes(...messages);
    return u8n(await s.digest("SHA-512", m.buffer));
  }, "sha512Async"),
  sha512Sync: void 0,
  bytesToHex,
  hexToBytes,
  concatBytes,
  mod: M,
  invert,
  randomBytes
};
var W = 8;
var scalarBits = 256;
var pwindows = Math.ceil(scalarBits / W) + 1;
var pwindowSize = 2 ** (W - 1);
var precompute = /* @__PURE__ */ __name(() => {
  const points = [];
  let p = G;
  let b = p;
  for (let w = 0; w < pwindows; w++) {
    b = p;
    points.push(b);
    for (let i = 1; i < pwindowSize; i++) {
      b = b.add(p);
      points.push(b);
    }
    p = b.double();
  }
  return points;
}, "precompute");
var Gpows = void 0;
var ctneg = /* @__PURE__ */ __name((cnd, p) => {
  const n = p.negate();
  return cnd ? n : p;
}, "ctneg");
var wNAF = /* @__PURE__ */ __name((n) => {
  const comp = Gpows || (Gpows = precompute());
  let p = I;
  let f = G;
  const pow_2_w = 2 ** W;
  const maxNum = pow_2_w;
  const mask = big(pow_2_w - 1);
  const shiftBy = big(W);
  for (let w = 0; w < pwindows; w++) {
    let wbits = Number(n & mask);
    n >>= shiftBy;
    if (wbits > pwindowSize) {
      wbits -= maxNum;
      n += 1n;
    }
    const off = w * pwindowSize;
    const offF = off;
    const offP = off + Math.abs(wbits) - 1;
    const isEven = w % 2 !== 0;
    const isNeg = wbits < 0;
    if (wbits === 0) {
      f = f.add(ctneg(isEven, comp[offF]));
    } else {
      p = p.add(ctneg(isNeg, comp[offP]));
    }
  }
  return { p, f };
}, "wNAF");

// ../sdk/dist/types.js
var IKI_BIN_COUNT = 100;
var IKI_BIN_WIDTH_MS = 50;
var IKI_MAX_MS = IKI_BIN_COUNT * IKI_BIN_WIDTH_MS;
var EFFORT_THRESHOLDS = {
  none: 0,
  low: 0.1,
  moderate: 0.3,
  high: 0.6
};
var BADGE_READY_THRESHOLD = EFFORT_THRESHOLDS.moderate;

// ../sdk/dist/canonical.js
function canonicalJSON(obj) {
  return JSON.stringify(obj, sortedReplacer);
}
__name(canonicalJSON, "canonicalJSON");
function sortedReplacer(_key, value) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const sorted = {};
    for (const k of Object.keys(value).sort()) {
      sorted[k] = value[k];
    }
    return sorted;
  }
  return value;
}
__name(sortedReplacer, "sortedReplacer");

// src/validate.ts
var VALID_BANDS = ["none", "low", "moderate", "high"];
var VALID_INPUT_METHODS = ["web_keyboard", "accessibility_observed", "compose_in_app"];
var POHA_VERSION = "0.1";
var MAX_TIMESTAMP_AGE_MS = 24 * 60 * 60 * 1e3;
var BAND_THRESHOLDS = {
  none: [0, 0.1],
  low: [0.1, 0.3],
  moderate: [0.3, 0.6],
  high: [0.6, 1]
};
function hexToBytes2(hex) {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
__name(hexToBytes2, "hexToBytes");
async function validateAttestation(att) {
  if (att.poha_version !== POHA_VERSION) {
    return { valid: false, error: `unsupported version: ${att.poha_version}` };
  }
  if (!att.content_hash || !att.signer_pubkey || !att.signature || !att.timestamp_hour) {
    return { valid: false, error: "missing required fields" };
  }
  if (typeof att.content_hash !== "string" || typeof att.signer_pubkey !== "string" || typeof att.signature !== "string" || typeof att.timestamp_hour !== "string" || typeof att.input_method !== "string" || typeof att.effort_band !== "string") {
    return { valid: false, error: "fields must be strings" };
  }
  if (!/^sha256:[0-9a-f]{64}$/.test(att.content_hash)) {
    return { valid: false, error: "invalid content_hash format" };
  }
  if (typeof att.effort_score !== "number" || att.effort_score < 0 || att.effort_score > 1) {
    return { valid: false, error: "effort_score must be 0.0 to 1.0" };
  }
  if (!VALID_BANDS.includes(att.effort_band)) {
    return { valid: false, error: `invalid effort_band: ${att.effort_band}` };
  }
  const [bandMin, bandMax] = BAND_THRESHOLDS[att.effort_band];
  if (att.effort_score < bandMin || att.effort_score > bandMax) {
    return { valid: false, error: `effort_score ${att.effort_score} inconsistent with band ${att.effort_band}` };
  }
  if (!VALID_INPUT_METHODS.includes(att.input_method)) {
    return { valid: false, error: `invalid input_method: ${att.input_method}` };
  }
  const tsRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:00:00\.000Z$/;
  if (!tsRegex.test(att.timestamp_hour)) {
    return { valid: false, error: "timestamp_hour must be rounded to the hour" };
  }
  const tsDate = new Date(att.timestamp_hour);
  if (isNaN(tsDate.getTime())) {
    return { valid: false, error: "invalid timestamp_hour" };
  }
  const age = Date.now() - tsDate.getTime();
  if (age > MAX_TIMESTAMP_AGE_MS) {
    return { valid: false, error: "timestamp_hour is older than 24 hours" };
  }
  if (age < -MAX_TIMESTAMP_AGE_MS) {
    return { valid: false, error: "timestamp_hour is in the future" };
  }
  if (typeof att.composition_duration_ms !== "number" || att.composition_duration_ms < 0 || att.composition_duration_ms > 864e5) {
    return { valid: false, error: "composition_duration_ms must be 0 to 86400000" };
  }
  if (typeof att.final_text_length !== "number" || att.final_text_length < 0 || att.final_text_length > 1e5) {
    return { valid: false, error: "final_text_length must be 0 to 100000" };
  }
  const { signature, ...unsigned } = att;
  const signingInput = new TextEncoder().encode(canonicalJSON(unsigned));
  const pubkeyMatch = att.signer_pubkey.match(/^ed25519:([0-9a-f]+)$/);
  if (!pubkeyMatch) {
    return { valid: false, error: "invalid signer_pubkey format" };
  }
  if (pubkeyMatch[1].length !== 64) {
    return { valid: false, error: "invalid signer_pubkey length" };
  }
  const pubkeyBytes = hexToBytes2(pubkeyMatch[1]);
  if (!pubkeyBytes) {
    return { valid: false, error: "invalid signer_pubkey hex encoding" };
  }
  const sigMatch = signature.match(/^ed25519:([0-9a-f]+)$/);
  if (!sigMatch) {
    return { valid: false, error: "invalid signature format" };
  }
  if (sigMatch[1].length !== 128) {
    return { valid: false, error: "invalid signature length" };
  }
  const sigBytes = hexToBytes2(sigMatch[1]);
  if (!sigBytes) {
    return { valid: false, error: "invalid signature hex encoding" };
  }
  try {
    const valid = await verifyAsync(sigBytes, signingInput, pubkeyBytes);
    if (!valid) {
      return { valid: false, error: "signature verification failed" };
    }
  } catch {
    return { valid: false, error: "signature verification error" };
  }
  return { valid: true };
}
__name(validateAttestation, "validateAttestation");

// src/short-id.ts
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var ID_LENGTH = 5;
var MAX_VALID = 247;
function generateShortId() {
  let id = "";
  while (id.length < ID_LENGTH) {
    const bytes = new Uint8Array(ID_LENGTH - id.length + 2);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < bytes.length && id.length < ID_LENGTH; i++) {
      if (bytes[i] <= MAX_VALID) {
        id += ALPHABET[bytes[i] % ALPHABET.length];
      }
    }
  }
  return id;
}
__name(generateShortId, "generateShortId");

// src/rate-limit.ts
async function checkAndIncrementRateLimit(env, pubkey) {
  const id = env.RATE_LIMITER.idFromName(pubkey);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch(new Request("https://do/check-and-increment", { method: "POST" }));
  return res.json();
}
__name(checkAndIncrementRateLimit, "checkAndIncrementRateLimit");

// src/verify-page.ts
var APP_URL = "https://poha.ink";
function renderVerifyPage(stored) {
  const att = stored.attestation;
  const tsDate = new Date(att.timestamp_hour);
  const formattedDate = tsDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
  const formattedHour = tsDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true
  });
  const bandColor = getBandColor(att.effort_band);
  const bandLabel = att.effort_band.charAt(0).toUpperCase() + att.effort_band.slice(1);
  const durationStr = formatDuration(att.composition_duration_ms);
  const inputMethodStr = formatInputMethod(att.input_method);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Typed by hand &ndash; PoHA ${escapeHtml(stored.short_id)}</title>
  <meta name="description" content="This message was composed through direct keyboard interaction. Verified by PoHA.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://api.fontshare.com; font-src https://cdn.fontshare.com; img-src 'none'; script-src 'none'">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <link rel="preconnect" href="https://api.fontshare.com">
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-verify: #0a0a0a;
      --surface-overlay: #1a1a1a;
      --text-inverse: #f0f0f0;
      --text-inverse-secondary: #9ca3af;
      --border-dark: #374151;
      --font-display: 'Satoshi', system-ui, sans-serif;
      --font-body: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--font-body);
      background: var(--bg-verify);
      color: var(--text-inverse);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 64px 16px;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .hero-emoji {
      font-size: 64px;
      line-height: 1;
      margin-bottom: 24px;
    }
    .verify-hero {
      font-family: var(--font-display);
      font-size: 40px;
      font-weight: 700;
      line-height: 48px;
      color: var(--text-inverse);
      margin-bottom: 12px;
    }
    .verify-band {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: ${bandColor};
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 32px;
    }
    .verify-band .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${bandColor};
    }
    .verify-stats {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-bottom: 24px;
    }
    .verify-stat { text-align: center; }
    .verify-stat-value {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-inverse);
    }
    .verify-stat-label {
      font-size: 12px;
      color: var(--text-inverse-secondary);
      margin-top: 4px;
    }
    .verify-input-method {
      font-size: 13px;
      color: var(--text-inverse-secondary);
      margin-bottom: 32px;
    }
    .verify-explainer {
      font-size: 13px;
      line-height: 20px;
      color: var(--text-inverse-secondary);
      max-width: 480px;
      margin: 0 auto 32px;
      text-align: left;
      padding: 16px;
      border: 1px solid var(--border-dark);
      border-radius: 8px;
    }
    /* Collapsed technical details */
    details {
      text-align: left;
      margin-bottom: 32px;
    }
    summary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-inverse-secondary);
      cursor: pointer;
      padding: 10px 16px;
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      list-style: none;
      transition: background 100ms ease-out;
    }
    summary:hover {
      background: var(--surface-overlay);
    }
    summary::-webkit-details-marker { display: none; }
    summary::after {
      content: '\\25B8';
      font-size: 10px;
      transition: transform 200ms ease-out;
    }
    details[open] summary::after {
      transform: rotate(90deg);
    }
    .hash-section {
      padding: 16px;
      background: var(--surface-overlay);
      border: 1px solid var(--border-dark);
      border-radius: 8px;
      margin-top: 8px;
    }
    .hash-label {
      font-size: 12px;
      color: var(--text-inverse-secondary);
      margin-bottom: 4px;
    }
    .hash-value {
      font-size: 11px;
      color: #666666;
      font-family: var(--font-mono);
      word-break: break-all;
      line-height: 1.5;
    }
    .hash-spacer { margin-top: 12px; }
    /* CTA */
    .verify-cta {
      margin-bottom: 24px;
    }
    .verify-cta a {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #1a1a1a;
      color: var(--text-inverse);
      border: 1px solid var(--border-dark);
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: background 100ms ease-out;
    }
    .verify-cta a:hover {
      background: #252525;
    }
    .verify-footer {
      font-size: 13px;
      color: var(--text-inverse-secondary);
    }
    .verify-footer a {
      color: var(--text-inverse-secondary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    @media (max-width: 640px) {
      body { padding: 32px 16px; }
      .verify-hero { font-size: 32px; line-height: 40px; }
      .verify-stats { flex-direction: column; gap: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero-emoji">\u270D\uFE0F</div>

    <div class="verify-hero">Typed by hand</div>
    <div class="verify-band"><span class="dot"></span> ${escapeHtml(bandLabel)} effort</div>

    <div class="verify-stats">
      <div class="verify-stat">
        <div class="verify-stat-value">${escapeHtml(durationStr)}</div>
        <div class="verify-stat-label">Duration</div>
      </div>
      <div class="verify-stat">
        <div class="verify-stat-value">${att.final_text_length.toLocaleString()} chars</div>
        <div class="verify-stat-label">Length</div>
      </div>
      <div class="verify-stat">
        <div class="verify-stat-value">${escapeHtml(formattedDate)}, ${escapeHtml(formattedHour)}</div>
        <div class="verify-stat-label">Timestamp</div>
      </div>
    </div>

    <div class="verify-input-method">${escapeHtml(inputMethodStr)}</div>

    <div class="verify-explainer">
      This message was composed through direct keyboard interaction &mdash; typing, pausing, and editing in real time. PoHA measures how text was entered, never what was typed. No message content is stored.
    </div>

    <details>
      <summary>Technical details</summary>
      <div class="hash-section">
        <div class="hash-label">Content Hash</div>
        <div class="hash-value">${escapeHtml(att.content_hash)}</div>
        <div class="hash-spacer"></div>
        <div class="hash-label">Signer</div>
        <div class="hash-value">${escapeHtml(att.signer_pubkey)}</div>
      </div>
    </details>

    <div class="verify-cta">
      <a href="${APP_URL}">\u270D\uFE0F Get your own badge</a>
    </div>

    <div class="verify-footer">
      Proof of Human Attention v${escapeHtml(att.poha_version)}
    </div>
  </div>
</body>
</html>`;
}
__name(renderVerifyPage, "renderVerifyPage");
function render404Page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Badge Not Found &ndash; PoHA</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="DENY">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0a0a0a;
      color: #f0f0f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    h1 { font-size: 20px; color: #ffffff; margin-bottom: 8px; }
    p { font-size: 14px; color: #9ca3af; max-width: 320px; text-align: center; }
  </style>
</head>
<body>
  <h1>Badge Not Found</h1>
  <p>This badge may have expired or never existed. Badges are retained for one year after creation.</p>
</body>
</html>`;
}
__name(render404Page, "render404Page");
function renderLandingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PoHA &ndash; Proof of Human Attention</title>
  <meta name="description" content="Badge your messages with proof of human attention. PoHA measures typing effort, not content.">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://api.fontshare.com; font-src https://cdn.fontshare.com; img-src 'none'; script-src 'none'">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <link rel="preconnect" href="https://api.fontshare.com">
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0a0a0a;
      --text: #f0f0f0;
      --text-dim: #9ca3af;
      --border: #374151;
      --green: #22c55e;
      --font-display: 'Satoshi', system-ui, sans-serif;
      --font-body: system-ui, -apple-system, sans-serif;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--font-body);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      -webkit-font-smoothing: antialiased;
    }
    .hero-emoji { font-size: 64px; margin-bottom: 24px; }
    h1 {
      font-family: var(--font-display);
      font-size: 40px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .tagline {
      font-size: 16px;
      color: var(--text-dim);
      max-width: 420px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: var(--green);
      color: #0a0a0a;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 100ms;
    }
    .cta:hover { opacity: 0.9; }
    .footer {
      margin-top: 48px;
      font-size: 13px;
      color: var(--text-dim);
    }
    .footer a { color: var(--text-dim); text-decoration: underline; text-underline-offset: 2px; }
  </style>
</head>
<body>
  <div class="hero-emoji">\u270D\uFE0F</div>
  <h1>Proof of Human Attention</h1>
  <p class="tagline">Badge any message with proof that you typed it by hand. PoHA measures how text was entered &mdash; timing, pauses, revisions &mdash; never what was typed.</p>
  <a class="cta" href="https://web.poha.ink">\u270D\uFE0F Start typing</a>
  <div class="footer">
    <a href="https://github.com/diwakarss/poha">GitHub</a>
  </div>
</body>
</html>`;
}
__name(renderLandingPage, "renderLandingPage");
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}
__name(escapeHtml, "escapeHtml");
function getBandColor(band) {
  switch (band) {
    case "high":
      return "#22c55e";
    case "moderate":
      return "#f59e0b";
    case "low":
      return "#6b7280";
    case "none":
      return "#6b7280";
    default:
      return "#6b7280";
  }
}
__name(getBandColor, "getBandColor");
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1e3);
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes} min ${remainingSeconds} sec`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
__name(formatDuration, "formatDuration");
function formatInputMethod(method) {
  switch (method) {
    case "web_keyboard":
      return "Keyboard";
    case "accessibility_observed":
      return "Accessibility input";
    case "compose_in_app":
      return "In-app";
    default:
      return method.replace(/_/g, " ");
  }
}
__name(formatInputMethod, "formatInputMethod");

// src/rate-limiter-do.ts
var DAILY_LIMIT = 100;
var RateLimiterDO = class {
  static {
    __name(this, "RateLimiterDO");
  }
  state;
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/check" && request.method === "POST") {
      return this.handleCheck();
    }
    if (url.pathname === "/check-and-increment" && request.method === "POST") {
      return this.handleCheckAndIncrement();
    }
    return Response.json({ error: "unknown action" }, { status: 400 });
  }
  async handleCheck() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const stored = await this.state.storage.get("limit");
    const count = stored && stored.date === today ? stored.count : 0;
    if (count >= DAILY_LIMIT) {
      return Response.json({ allowed: false, remaining: 0 });
    }
    return Response.json({ allowed: true, remaining: DAILY_LIMIT - count });
  }
  /**
   * Atomically check the limit and increment in one call.
   * Returns { allowed, remaining } — if allowed is true, the counter was already incremented.
   */
  async handleCheckAndIncrement() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const stored = await this.state.storage.get("limit");
    const currentCount = stored && stored.date === today ? stored.count : 0;
    if (currentCount >= DAILY_LIMIT) {
      return Response.json({ allowed: false, remaining: 0 });
    }
    const newCount = currentCount + 1;
    await this.state.storage.put("limit", { count: newCount, date: today });
    return Response.json({
      allowed: true,
      remaining: Math.max(0, DAILY_LIMIT - newCount)
    });
  }
};

// src/index.ts
var KV_TTL_SECONDS = 365 * 24 * 60 * 60;
var MAX_COLLISION_RETRIES = 5;
var SHORT_ID_PATTERN = /^\/([A-Za-z0-9]{5})$/;
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request)
      });
    }
    if (request.method === "POST" && path === "/attest") {
      return handleAttest(request, env);
    }
    const apiMatch = path.match(/^\/api\/([A-Za-z0-9]{5})$/);
    if (request.method === "GET" && apiMatch) {
      return handleApi(apiMatch[1], env, request);
    }
    if (request.method === "GET" && path === "/") {
      return new Response(renderLandingPage(), {
        headers: { "Content-Type": "text/html;charset=utf-8" }
      });
    }
    const verifyMatch = path.match(SHORT_ID_PATTERN);
    if (request.method === "GET" && verifyMatch) {
      return handleVerify(verifyMatch[1], env, request);
    }
    return Response.json({ error: "not found" }, { status: 404 });
  }
};
async function handleAttest(request, env) {
  let att;
  try {
    const body = await request.json();
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "body must be a JSON object" }, {
        status: 400,
        headers: corsHeaders(request)
      });
    }
    att = body;
  } catch {
    return Response.json({ error: "invalid JSON body" }, {
      status: 400,
      headers: corsHeaders(request)
    });
  }
  let validation;
  try {
    validation = await validateAttestation(att);
  } catch {
    return Response.json({ error: "invalid attestation structure" }, {
      status: 400,
      headers: corsHeaders(request)
    });
  }
  if (!validation.valid) {
    return Response.json({ error: validation.error }, {
      status: 400,
      headers: corsHeaders(request)
    });
  }
  const rateCheck = await checkAndIncrementRateLimit(env, att.signer_pubkey);
  if (!rateCheck.allowed) {
    return Response.json({ error: "rate limit exceeded (100/day per key)" }, {
      status: 429,
      headers: {
        ...corsHeaders(request),
        "Retry-After": "86400"
      }
    });
  }
  let shortId = "";
  for (let i = 0; i < MAX_COLLISION_RETRIES; i++) {
    const candidate = generateShortId();
    const existing = await env.ATTESTATIONS.get(`att:${candidate}`);
    if (!existing) {
      shortId = candidate;
      break;
    }
  }
  if (!shortId) {
    return Response.json({ error: "failed to generate unique ID, please retry" }, {
      status: 500,
      headers: corsHeaders(request)
    });
  }
  const stored = {
    attestation: att,
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    short_id: shortId
  };
  await env.ATTESTATIONS.put(
    `att:${shortId}`,
    JSON.stringify(stored),
    { expirationTtl: KV_TTL_SECONDS }
  );
  return Response.json({
    short_id: shortId,
    verify_url: `/${shortId}`,
    remaining_today: rateCheck.remaining
  }, {
    status: 201,
    headers: corsHeaders(request)
  });
}
__name(handleAttest, "handleAttest");
async function handleVerify(id, env, request) {
  const data = await env.ATTESTATIONS.get(`att:${id}`);
  if (!data) {
    return new Response(render404Page(), {
      status: 404,
      headers: { "Content-Type": "text/html;charset=utf-8" }
    });
  }
  const stored = JSON.parse(data);
  return new Response(renderVerifyPage(stored), {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(handleVerify, "handleVerify");
async function handleApi(id, env, request) {
  const data = await env.ATTESTATIONS.get(`att:${id}`);
  if (!data) {
    return Response.json({ error: "not found" }, {
      status: 404,
      headers: corsHeaders(request)
    });
  }
  const stored = JSON.parse(data);
  return Response.json(stored, {
    headers: {
      ...corsHeaders(request),
      "Cache-Control": "public, max-age=3600"
    }
  });
}
__name(handleApi, "handleApi");
var ALLOWED_ORIGINS = [
  "https://poha.ink",
  "https://web.poha.ink",
  "https://app.poha.ink",
  "https://poha.dev",
  "https://www.poha.dev",
  "https://www.poha.ink",
  "http://localhost:5173"
];
function corsHeaders(request) {
  const origin = request?.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}
__name(corsHeaders, "corsHeaders");

// ../../node_modules/.bun/wrangler@4.79.0+73af1b64962f50e6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../node_modules/.bun/wrangler@4.79.0+73af1b64962f50e6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-B79bqM/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../node_modules/.bun/wrangler@4.79.0+73af1b64962f50e6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-B79bqM/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  RateLimiterDO,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
/*! Bundled license information:

@noble/ed25519/index.js:
  (*! noble-ed25519 - MIT License (c) 2019 Paul Miller (paulmillr.com) *)
*/
//# sourceMappingURL=index.js.map
