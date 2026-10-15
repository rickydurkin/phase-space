// Little-endian binary writer and reader for snapshots and domain blobs.

export class ByteWriter {
  private buf: ArrayBuffer;
  private view: DataView;
  private u8: Uint8Array;
  private pos = 0;

  constructor(initial = 1024) {
    this.buf = new ArrayBuffer(initial);
    this.view = new DataView(this.buf);
    this.u8 = new Uint8Array(this.buf);
  }

  private ensure(n: number): void {
    if (this.pos + n <= this.buf.byteLength) return;
    let size = this.buf.byteLength * 2;
    while (size < this.pos + n) size *= 2;
    const next = new ArrayBuffer(size);
    new Uint8Array(next).set(this.u8.subarray(0, this.pos));
    this.buf = next;
    this.view = new DataView(next);
    this.u8 = new Uint8Array(next);
  }

  u8v(x: number): this {
    this.ensure(1);
    this.view.setUint8(this.pos, x);
    this.pos += 1;
    return this;
  }

  u32(x: number): this {
    this.ensure(4);
    this.view.setUint32(this.pos, x >>> 0, true);
    this.pos += 4;
    return this;
  }

  f64(x: number): this {
    this.ensure(8);
    this.view.setFloat64(this.pos, x, true);
    this.pos += 8;
    return this;
  }

  f64s(a: ArrayLike<number>): this {
    for (let i = 0; i < a.length; i++) this.f64(a[i] as number);
    return this;
  }

  /** Length-prefixed byte block. */
  bytes(b: Uint8Array): this {
    this.u32(b.length);
    this.ensure(b.length);
    this.u8.set(b, this.pos);
    this.pos += b.length;
    return this;
  }

  /** Length-prefixed string stored as UTF-16 code units. */
  str(s: string): this {
    this.u32(s.length);
    this.ensure(s.length * 2);
    for (let i = 0; i < s.length; i++) {
      this.view.setUint16(this.pos, s.charCodeAt(i), true);
      this.pos += 2;
    }
    return this;
  }

  finish(): Uint8Array {
    return this.u8.slice(0, this.pos);
  }
}

export class ByteReader {
  private readonly view: DataView;
  private readonly u8: Uint8Array;
  private pos = 0;

  constructor(bytes: Uint8Array) {
    this.u8 = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get remaining(): number {
    return this.u8.length - this.pos;
  }

  u8v(): number {
    const v = this.view.getUint8(this.pos);
    this.pos += 1;
    return v;
  }

  u32(): number {
    const v = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return v;
  }

  f64(): number {
    const v = this.view.getFloat64(this.pos, true);
    this.pos += 8;
    return v;
  }

  bytes(): Uint8Array {
    const n = this.u32();
    const out = this.u8.slice(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }

  str(): string {
    const n = this.u32();
    let s = '';
    for (let i = 0; i < n; i++) {
      s += String.fromCharCode(this.view.getUint16(this.pos, true));
      this.pos += 2;
    }
    return s;
  }
}
