export class Random {
  constructor(seed = Date.now()) {
    this.seed = Number(seed) >>> 0 || 1;
  }
  next() {
    // Mulberry32: small deterministic PRNG for reproducible runs and tests.
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick(items) {
    return items[Math.floor(this.next() * items.length)];
  }
  getState() {
    return this.seed >>> 0;
  }
  setState(seed) {
    this.seed = Number(seed) >>> 0 || 1;
  }
}
