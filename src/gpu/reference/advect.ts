// CPU reference for kernels/advect.wgsl, in single precision like the GPU.
const f = Math.fround;

export function advectReference(
  position: Float32Array,
  velocity: Float32Array,
  dt: number,
  bound: number,
  count: number,
): Float32Array {
  const out = new Float32Array(position.length);
  const span = f(2 * bound);
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < 4; c++) {
      const k = i * 4 + c;
      let p = f((position[k] as number) + f((velocity[k] as number) * f(dt)));
      p = f(p - f(Math.floor(f(f(p + f(bound)) / span)) * span));
      out[k] = p;
    }
  }
  return out;
}
