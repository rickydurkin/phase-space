// Particle advection: p += v * dt, wrapped into [-bound, bound). Detail layer
// only (MASTER 2.3): results never enter the authoritative simulation.
struct Params {
  dt: f32,
  count: u32,
  bound: f32,
  pad: f32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> velocity: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> position: array<vec4<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.count) {
    return;
  }
  var p = position[i] + velocity[i] * params.dt;
  let span = 2.0 * params.bound;
  p = p - floor((p + vec4<f32>(params.bound)) / span) * span;
  position[i] = p;
}
