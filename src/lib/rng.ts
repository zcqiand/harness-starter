export function rngStep(state: number): [number, number] {
  let t = (state + 0x6d2b79f5) | 0;
  let r = t;
  r = Math.imul(r ^ (r >>> 15), r | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}
export function rngInt(state: number, max: number): [number, number] {
  const [v, s] = rngStep(state);
  return [Math.floor(v * max), s];
}
