# Research snapshot, 14/10/2026

The dated baseline behind programme v1.0.0. Package versions were checked against the npm registry on 14/10/2026 (marked "npm"). Other facts come from official documentation, release notes, repositories, papers and store data gathered the same day; anything not confirmed is marked "unverified". Re-check everything at the start of each phase (MASTER 16.1) and write the differences into docs/research/.

## 1. Package versions (npm, 14/10/2026)

| Package | Latest | Published |
|---|---|---|
| three | 0.186.1 | 24/09/2026 |
| @dimforge/rapier3d, -deterministic-compat, -simd-compat | 0.21.0 | 25/09/2026 |
| typescript | 7.0.2 | 08/07/2026 |
| vite | 8.3.4 | 08/10/2026 |
| vitest | 5.0.4 | 12/10/2026 |
| @playwright/test | 1.64.1 | 14/10/2026 |
| webgpu (Dawn for Node) | 0.6.2 | 02/10/2026 |
| @webgpu/types | 0.1.74 | 19/09/2026 |
| fast-check | 4.10.2 | 19/09/2026 |
| jolt-physics | 1.1.0 | 11/07/2026 |
| typegpu | 0.12.7 | 06/10/2026 |
| mediabunny | 1.61.4 | 12/10/2026 |
| three-gpu-pathtracer | 0.0.27 | 08/10/2026 |
| zod | 4.6.7 | 12/10/2026 |
| bitecs | 0.4.0 | 06/12/2025 |
| uplot | 1.6.32 | 14/03/2025 |
| comlink | 4.4.2 | 07/11/2024 |

Also reported (not re-checked): Babylon.js 9.30.0 (08/10/2026; 9.0 shipped 26/03/2026), PlayCanvas 2.23.2 (09/10/2026), @babylonjs/havok 1.3.14, physx-js-webidl 2.8.0 (PhysX 5.11), @mujoco/mujoco 3.16.0 (official bindings, described as work in progress), Spark 2.3.1, koota 0.6.6, React 19.3.1, Solid 1.9.17, Svelte 5.57.2, Preact 11.0.1, valibot 1.5.0, Playwright MCP 0.0.83, Chrome DevTools MCP 1.10.1, Claude Code CLI 2.1.300.

## 2. Rigid-body engines

| Engine | Status | Determinism | Notes |
|---|---|---|---|
| Rapier.js 0.21.0 (Rust rapier 0.36) | production, pre-1.0; Apache-2.0 | only the -deterministic packages are documented as cross-platform; default builds are "locally deterministic" | SIMD builds; no multithreaded npm build; multibody joints, CCD on by default against fixed colliders, character and raycast-vehicle controllers; 0.21 added soft bodies (rope, cloth, volumetric FEM) with tearing; snapshots are not portable across Rapier versions; a broad-phase divergence after restore was fixed in Rapier 0.33 |
| JoltPhysics.js 1.1.0 (Jolt 5.6.0) | mature core; MIT | deterministic with the same binary; npm builds ship without CROSS_PLATFORM_DETERMINISTIC | multithreaded build does not work in Safari; SaveState and RestoreState exposed; raw WebIDL API with manual destroy() |
| Havok (Babylon) | mature; MIT licence file, binary only | undocumented (unverified) | usable without Babylon |
| Box3D (Erin Catto) | announced 30/06/2026; alpha 0.1.0; MIT | claims cross-platform determinism and replay | no JavaScript bindings yet: watch list |
| Dimforge Nexus 0.7.0 | experimental | same machine and build only | "Rapier on the GPU"; WebGPU but not Safari; Rust only; two-way MPM coupling for up to 16 bodies |
| Box2D v3.1 | mature; MIT | cross-platform | 2D only |
| Newton 1.6.1 (NVIDIA, DeepMind, Disney) | 1.x; Apache-2.0 | n/a | Python on Warp, CUDA or CPU, no browser; worth reading for algorithms (VBD, implicit MPM, MuJoCo Warp) |

Indicative benchmark (Node 22, 2 vCPU 2.1 GHz Xeon, single-threaded WASM, stacked cubes with sleeping off):

| Build | 1,000 bodies, ms per step | 2,000 bodies | Snapshot at 1,000 bodies | Save | Restore |
|---|---|---|---|---|---|
| rapier3d-compat | 3.7 | 5.9 | 3.2 MB | 6.3 ms | 14.6 ms |
| rapier3d-simd-compat | 1.7 | 3.8 | 3.2 MB | 5.6 ms | 11.9 ms |
| rapier3d-deterministic-compat | 4.4 | 6.8 | 3.2 MB | 4.7 ms | 8.9 ms |
| jolt-physics wasm-compat | 3.3 | 7.4 | in memory | 1.2 ms | 1.2 ms |

Every build restored a snapshot and stepped 60 frames with a bit-identical result. SIMD and non-SIMD builds gave different results from each other, as expected. A Rapier snapshot is about 3.3 KB per body, too expensive every frame at scale: record inputs and keep sparse checkpoints.

## 3. GPU continuum simulation and GPU solvers

- 3D MLS-MPM in the browser: WebGPU-Ocean (MIT) claims about 100,000 particles on integrated graphics and about 300,000 on "decent" GPUs; its SPH mode tops out near 30,000 on integrated graphics. A Codrops write-up (26/02/2025) shows about 100,000 MLS-MPM particles in real time on an AMD Ryzen 7 5825U's integrated GPU. Splash (MIT) has a branch reaching 1.6 million particles (frame rate not stated). No browser MPM benchmark on an M-series Max chip was found; 0.5 to 1 million particles at 60 fps is a speculative estimate from memory bandwidth.
- three.js r186 example webgpu_compute_particles_fluid: MLS-MPM in TSL with fixedPointMultiplier 1e7, a 64^3 grid, 32,768 particles by default and up to 131,072. Also webgpu_compute_cloth, webgpu_compute_water (heightfield with floating ducks) and webgpu_volume_fire (r185, a 100 x 100 x 200 grid with advection, buoyancy and a Jacobi pressure solve).
- PB-MPM (EA SEED, Chris Lewin, SIGGRAPH 2024; electronicarts/pbmpm, BSD-3-Clause): the WebGPU demo is 2D; it pioneered fixed-point i32 atomic scatter for particle-to-grid.
- AVBD (Giles, Diaz and Yuksel, SIGGRAPH 2025): official CPU demos (MIT). sbobyn/three-avbd (TypeScript, three.js, WGSL, MIT) reports on an M4 Max in Chrome: a 110,000-brick ring at 9.3 to 10.4 ms per step, 34,000 bodies with 71,000 joints at 6.4 ms, 506,000 bricks at about 25 ms. Determinism lessons from it: atomically built constraint lists changed order between runs until a sort pass was added (about 1% cost), and WGSL's built-in trig is only bounded to 2^-11 absolute error, so M1 Pro and M4 Max disagreed until custom polynomials replaced the built-ins. jure/webphysics is an early AVBD proof of concept, Chrome only.
- Kora fire port (jameskane05/kora-fire-threejs): Eulerian combustion with MLS-MPM and AVBD in one three.js sandbox; 64^3 grid at 3.3 ms, 96^3 at 18.9 ms, 128^3 at 49.7 ms on an M3 MacBook Air. No licence stated: read for technique only.
- Two-way rigid and MPM coupling references: Nexus (MpmOneWay, MpmTwoWay), Newton's mpm_twoway_coupling example, Drake's convex MPM-rigid coupling (arXiv 2503.05046), and the original MLS-MPM paper (Hu et al. 2018). Heat and phase change in MPM: Stomakhin et al. 2014 ("Augmented MPM for phase-change and varied materials"); no open-source browser implementation was found.
- No maintained WebGPU library for PBF, FLIP or XPBD was found (unverified).

## 4. Determinism facts

- Integer addition is order-independent, so fixed-point scatter removes ordering effects from sums. With a 1e7 multiplier each cell's i32 is capped near plus or minus 214 in physical units: choose multipliers per scene scale.
- The WGSL draft (21/09/2026) specifies no rounding mode, allows reassociation and fusion, allows flushing subnormals, and lets implementations assume no overflow, infinities or NaNs. Bit-exact GPU results across vendors are not achievable in practice: keep the authoritative simulation on the CPU.
- JavaScript Math transcendentals are implementation-approximated. An August 2026 issue in a physics library recorded different 900-step hashes on V8 11.3 and V8 14.9 because of Math.sin and Math.cos, while Math.sqrt matched; fdlibm-derived replacements fixed it at about 1.1 times the cost.
- WebAssembly is deterministic apart from NaN bit patterns, shared-memory races and relaxed SIMD; Wasm 3.0 defines a deterministic profile.
- Rapier's README and its older determinism page disagree about which builds are cross-platform deterministic; trust the README and use the -deterministic packages.

## 5. WebGPU platforms and features

| Platform | WebGPU status |
|---|---|
| Chrome desktop (Windows, macOS, ChromeOS) | since Chrome 113 (May 2023) |
| Chrome Android | since 121 (Jan 2024); compatibility mode on OpenGL ES 3.1 from 146 |
| Chrome Linux | Chrome 144 (Jan 2026) for Intel Gen12+; NVIDIA on Wayland from 147-148 |
| Safari (macOS, iOS, iPadOS, visionOS) | Safari 26.0 (15/09/2025); Safari 27.0 (17/09/2026) adds clip_distances; WebGPU on macOS 15 not confirmed |
| Firefox Windows | 141 (22/07/2025) |
| Firefox macOS | 145 (Apple Silicon on macOS 26), 147 (all macOS versions on Apple Silicon); Intel Macs Nightly only |
| Firefox Linux and Android | Nightly only, or not enabled |

Chrome feature arrivals: shader-f16 (120), timestamp-query (121), subgroups (134), compatibility mode (146), immediates (149-150), subgroup-size-control (151-152). Chrome 155 is stable (06/10/2026) and Chrome now ships every two weeks. Float atomics have no proposal; 64-bit atomics exist only as a min/max draft. On Apple Silicon, Chrome (Dawn's Metal backend) exposes shader-f16, subgroups, timestamp-query (when Metal allows), float32-filterable and -blendable, among others; Safari exposes shader-f16 and subgroups but not subgroup-size-control. Check adapter.features at runtime rather than trusting these lists.

## 6. Rendering

- three.js r186 (0.186.0 on 08/09/2026, 0.186.1 on 24/09/2026). The manual still calls WebGPURenderer experimental. Issue #30560: many separate draw calls are slower on WebGPU than WebGL (a November 2025 test on an M4 Pro drew 10,000 separate cubes at 60 fps on WebGPU against 130 fps on WebGL), so instancing and batching are mandatory.
- WebGL2 fallback: automatic, testable with forceWebGL. Compute is emulated with transform feedback, without storage buffers, atomics, workgroup memory or indirect dispatch, so MPM particle-to-grid cannot run there.
- Post-processing (RenderPipeline since r183, with MRT): TRAA, TAAU, FSR1, SMAA, FXAA, bloom, depth of field, motion blur (velocity MRT), SSR, GTAO, SSAO, SSGI (needs TRAA for its temporal mode), subsurface scattering, god rays, 3D LUTs, outlines, order-independent transparency and soft particles (r186).
- Shadows and volumes: SunLight with cascaded shadows (r186), PCF via textureGatherCompare, VSM, contact shadows, reversed depth, volumetric lighting and fog examples, clustered lights.
- Global illumination, cheapest first: LightProbeGrid (L2 spherical harmonics, WebGPU version in r186); SSGI (screen space, costly in big scenes); VXGINode (new in r186, voxel cone tracing, static geometry, 128 voxels by default and 256 at most, WebGPU only).
- Large particle counts: instancedArray buffers updated by renderer.compute() and read directly by materials; IndirectStorageBufferAttribute for GPU-driven counts (WebGPU only); compileComputeAsync in r186.
- Babylon.js 9.0 (26/03/2026): frame graph, clustered lighting, compute volumetric lighting with a WebGL2 fallback, node particle editor, splats, dynamic IBL shadows, OpenPBR (alpha), Havok with floating origin. Babylon Lite (June 2026) is a WebGPU-only rewrite.
- Gaussian splats: native in three.js r186; Spark 2.3.1 (WebGL2, streaming LoD); SuperSplat 3.0 editor. Useful only as static photo-real backdrops with collision proxies.
- Photo mode: three-gpu-pathtracer's WebGPUPathTracer (0.0.26 added OIDN denoising and upscaling; 0.0.27 on 08/10/2026); standard and physical materials only.

## 7. Scientific visualisation

- Colour maps: viridis or cividis for sequential data (cividis was optimised for red-green colour vision deficiency); diverging maps for signed fields; cyclic maps for angles; turbo only as an opt-in (not perceptually uniform). Prefer redundant cues (contours, glyph size, hover values) to global colour-blind filters.
- Schlieren responds to the first derivative of refractive index and shadowgraph to the second; implement as a line-of-sight integral of the refractive-index gradient through the density field (Gladstone-Dale), with knife-edge, circular and colour variants.
- Thermal camera (general practice, unverified): emissivity-weighted long-wave radiance, auto-gain with histogram equalisation, palettes, low resolution and fixed-pattern noise; polished metal reads cold and glass is opaque.
- Photoelasticity: dark-field circular polariscope intensity I = I0 sin^2(pi C d (s1 - s2) / lambda), summed over 8 to 16 wavelengths for white-light fringes.
- Vector fields: advected tracers, RK4 streamlines as ribbons, glyphs scaled by magnitude, line-integral convolution on slices; seed field lines in proportion to charge.

## 8. Audio

- Modal synthesis (van den Doel, Kry and Pai, FoleyAutomatic, SIGGRAPH 2001): banks of damped modes, raised-cosine impact force whose duration sets hardness, scraping as a noise profile through the modes; a noise residual per hit (Raghuvanshi et al., used in Crackdown 2).
- One AudioWorklet hosting all voices, fed by an event ring; Chrome 153 added renderSizeHint (64-frame quanta cut latency by about 2.9 ms on an M4 in one test). Faust physmodels compile to an AudioWorklet.
- Minnaert bubbles: f about 3.26 / r Hz (r in metres) for splashes.
- Web Audio dropped built-in Doppler: use a per-source variable delay (distance / c), which gives both arrival delay and Doppler. Supersonic sources: solve the retarded-time equation; the boom fires when the listener crosses the cone (sin theta = 1/M). A bullet's N-wave rises in under 2 microseconds: synthesise a band-limited N-wave.
- HRTF panners are costly (rule of thumb 16 to 24 voices on desktop, unverified); third-order ambisonics with one binaural decode (Omnitone) scales better.

## 9. Interaction and accessibility

- TransformControls supports snapping and world or local space; compatibility with WebGPURenderer is not documented: test it.
- Joints: the two-click pattern (Garry's Mod) with ghost previews, limit arcs and automatic no-collide.
- Undo through the command pattern, history serialisable to JSON, kept apart from the simulation timeline.
- Time controls: slow motion means fewer steps per frame, not a larger dt; rewind restores the nearest snapshot and re-simulates from the input log.
- Trackpads: pinch arrives as a wheel event with ctrlKey; there is no standard way to tell a trackpad from a mouse, so offer a setting; use non-passive wheel listeners and filter momentum tails.
- Gamepad haptics: dual-rumble in Chromium and Safari desktop; trigger rumble in Chromium only; none in Firefox.
- Onboarding (Hodent, GDC 2016): a live scene, grab and throw within seconds, three new things at most, no early failure, short text that explains why.
- Game Accessibility Guidelines: remappable controls, nothing by colour or sound alone, adjustable speed and field of view, no flicker, camera shake off, reduced motion respected.
- Capture: WebCodecs is in Chrome, Edge, Firefox 130+ and Safari 26; Mediabunny (MPL-2.0) muxes frame-exact offline renders; render audio with OfflineAudioContext from the same event log. Share links: CompressionStream("deflate-raw"), base64url, in the URL fragment, with versions.

## 10. Testing, CI and deployment

- Verified in a CPU-only Ubuntu container (Playwright 1.64.1, Chromium 156): the flags `--enable-unsafe-webgpu --enable-features=Vulkan --use-angle=vulkan --use-vulkan=swiftshader --use-webgpu-adapter=swiftshader` give a SwiftShader adapter, correct pixel readback via copyTextureToBuffer, and correct screenshots. With `--enable-unsafe-webgpu` alone, screenshots came out black. Make readback the primary assertion.
- Device loss: device.destroy() gives reason "destroyed"; the CDP command Browser.crashGpuProcess simulates a GPU crash (reason "unknown"), after which a new adapter and device worked. Navigating to chrome://gpucrash did nothing.
- Node WebGPU: the webgpu package (Dawn) ran a WGSL kernel under Vitest that matched a CPU reference exactly; on Linux it needs a Vulkan driver (mesa-vulkan-drivers gives llvmpipe). A 20-line validator using createShaderModule and getCompilationInfo reports WGSL errors with line numbers.
- Real GPUs in CI: GitHub's GPU runners (NVIDIA T4) and macOS 26 runners exist; Playwright's WebKit is not Safari, so treat Safari as a real-device check.
- Timing: WebGPU timestamps are quantised to 100 microseconds unless developer features are on; performance.now resolution is 100 microseconds without cross-origin isolation and 5 microseconds with it.
- Determinism testing: fixed step with accumulator and clamp; a test hook that steps n ticks; Playwright's page.clock; FNV-1a hashes over Float64Array state every N ticks (two 6,000-step runs hashed identically in a test); fast-check 4.10.2 for scene fuzzing (log seeds, freeze counterexamples, combine absolute and relative tolerances); model-based testing for input sequences.
- Soak: HeapProfiler.collectGarbage and Performance.getMetrics through CDP, a create and destroy wrapper counting GPU buffers and textures, MemLab for retainer traces.
- Hosting: GitHub Pages cannot set COOP or COEP headers (a request open since 2022); coi-serviceworker works around it but can loop and competes with a PWA service worker. Cloudflare Pages and Netlify read a _headers file; Vercel uses vercel.json. WebGPU itself needs only a secure context.
- Assets and budgets: gltf-transform CLI 4.5.x (meshopt, KTX2); Vite 8 warns above 500 kB per chunk; size-limit for CI gates; vite-plugin-pwa's default precache limit is 2 MiB per file.

## 11. Claude Code practice

- Anthropic, "Effective harnesses for long-running agents" (26/11/2025): an initializer session creates a JSON feature list (each entry with category, description, steps and passes: false), a progress file, an init script and a first commit; every later session reads progress and git history, runs a basic end-to-end check before new work, works on one feature at a time, verifies end to end, commits and updates the progress file. "It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality." JSON was chosen because "the model is less likely to inappropriately change or overwrite JSON files compared to Markdown files." Results improved sharply when the agent was told to use browser automation and test as a human user would.
- Anthropic engineering posts reported by research (not re-read here): building a C compiler with parallel Claudes (05/02/2026: a near-perfect task verifier, logs to files with grep-able ERROR lines, deterministic fast test samples, CI once late changes broke old features); harness design for long-running apps (24/03/2026: planner, generator and evaluator; the evaluator clicked through the app with Playwright MCP against hard thresholds); agent evals (09/01/2026: deterministic graders where possible, isolated trials).
- Claude Code best practices (docs, read 14/10/2026): give Claude a check it can run; gate stops with a /goal condition, a Stop hook or a verification subagent; show evidence rather than asserting success; keep CLAUDE.md short ("Would removing this cause Claude to make mistakes?"); hooks for anything that must happen every time; skills for procedures; subagents for investigation and fresh-context review ("flag only gaps that affect correctness or the stated requirements"); plan mode for multi-file work; /clear after two failed corrections; checkpoints do not replace git.
- Reported configuration details (unverified beyond the research): scoped rules in .claude/rules/*.md with paths frontmatter; subagent frontmatter supports tools, model, permissionMode, maxTurns, skills, hooks, memory and worktree isolation; Stop hooks block with exit code 2 or a block decision and have a consecutive-block cap; PostToolUse exit code 2 feeds stderr back to Claude; the Playwright CLI with skills uses less context than the Playwright MCP server; Chrome DevTools MCP offers performance traces, console messages, heap snapshots and Lighthouse; `claude --chrome` drives the user's real Chrome and GPU.

## 12. Game design reference set

Store and review data gathered 14/10/2026 (Steam review API; complaint shares from coding up to 300 helpful negative English reviews per game; theme weights from VaporLens, which are AI summaries). Treat as indicative.

- Universe Sandbox: 96% positive of 32,000 reviews; planet-scale what-ifs; "no goals" and weak tutorials are the main complaints.
- The Powder Toy: open source, 98% positive; coupled pressure, air, heat, electricity and gravity on one grid; performance and learning curve complaints.
- Oxygen Not Included: 97%; coupled heat, gas, liquid, plumbing and power; hand-tuned heat multipliers (liquid to liquid x625) and float precision create non-conservation that players farm.
- Noita: 95%; every pixel simulated; generated levels kept designable with Herringbone Wang tiles; "lack of guidance" is by far the top complaint.
- Teardown: 96%; destruction as planning; 12-player multiplayer (March 2026) syncs events rather than voxels.
- BeamNG.drive: 97% of 423,000; performance named in 41% of negative reviews.
- Besiege: 95%; the tenth-anniversary update added speed and destruction scoreboards and automatic slow motion under heavy load.
- Kerbal Space Program: 96%; KSP2 (26% positive) failed with wobbling rockets and a stalled roadmap: ship a stable physics core first.
- Poly Bridge 3: budget engineering, weekly challenges; difficulty spikes.
- Opus Magnum: histograms of cost, cycles and area with no other reward; a community bot re-simulates every solution; EXAPUNKS re-runs a solution 100 times before accepting it; workshop puzzles must be solved by their author first.
- Stormworks: a 2023 gravity change broke player ships; the developers planned regression tests built from in-game data loggers.
- Space Engineers 2 (Early Access 2025): autosave overwrites cost players progress.
- Web and GitHub: Sandspiel (3.2k stars; 70,000+ shared creations with no accounts; saves as PNGs), Ray Optics Simulation (1.8k), Falstad CircuitJS (a whole circuit in a URL), WebGL Fluid Simulation (16.7k), WebGPU-Ocean (559), Bruno Simon's folio-2025 (drivable world with physics and weather).
- 2025-2026 releases of note: PEAK (a new generated mountain every day), Sandustry (every pixel a simulated resource), Donkey Kong Bananza (voxel materials tied to rewards), Battlefield 6 (destruction driving VFX and audio from shared parameters), Kitten Space Agency (free pre-alpha with modding from day one).

Replayability mechanics with evidence: multi-metric histograms; daily seeded challenges; generation with proof of solvability; levels as strings in URLs; ghosts and verified boards through deterministic replay plus input-plausibility checks (Trackmania's 2021 cheating scandal); speed and efficiency boards; mutators; discovery logs; cross-system chains; looping clip export; mods.

Complaints across physics sandboxes: performance with big builds is the most common; unintuitive building UI; sandboxes without goals; physics updates that break creations; monetisation and abandonment draw more anger than bugs. Jitter and explosions are rarely the main complaint once a game is stable, but they sank KSP2's launch.

## 13. Learning science for mission design

- PhET implicit scaffolding: guidance through affordances, constraints, feedback and cues, so students are "guided without feeling guided"; in one study only 36% of groups tried the control tied to the core idea, so under-used controls need a targeted nudge.
- Physics Playground (Shute and colleagues): drawing ramps, levers, pendulums and springboards; stealth assessment by Bayesian networks correlated 0.36 to 0.40 with external tests and triggered adaptive help.
- Productive failure (Sinha and Kapur, 2021; 53 studies): problem-first beats instruction-first when learners can attempt the problem, the problem needs the new idea, and teaching afterwards compares their attempts with the canonical solution.
- Devices that defeat trial and error: one attempt or a cost per run; no preview; fresh numbers each attempt; a committed prediction before running; scoring the margin as well as success; re-running solutions under randomised conditions.
- AI tutoring: a randomised trial with 194 physics students (Kestin et al., Scientific Reports, 03/06/2025) found a tutor grounded in pre-written expert solutions more than doubled learning gains compared with in-class active learning.

## 14. Sources

Rigid bodies and GPU simulation: github.com/dimforge/rapier (bindings/typescript CHANGELOG and README), rapier.rs/docs/user_guides/javascript/determinism, github.com/jrouwe/JoltPhysics.js, github.com/erincatto/box3d, box2d.org/posts/2026/06/announcing-box3d, github.com/dimforge/nexus, github.com/newton-physics/newton, github.com/electronicarts/pbmpm, github.com/matsuoka-601/WebGPU-Ocean, github.com/matsuoka-601/Splash, tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering, graphics.cs.utah.edu/research/projects/avbd, github.com/sbobyn/three-avbd, github.com/jure/webphysics, github.com/jameskane05/kora-fire-threejs, arxiv.org/abs/2503.05046, disneyanimation.com/publications/augmented-mpm-for-phase-change-and-varied-materials.

Platform and rendering: github.com/gpuweb/gpuweb/wiki/Implementation-Status, developer.chrome.com/blog/new-in-webgpu-134 (and later posts), webkit.org/blog/17333/webkit-features-in-safari-26-0, webkit.org/blog/18325/webkit-features-for-safari-27-0, developer.mozilla.org Firefox release notes 141 to 158, www.w3.org/TR/2026/CRD-WGSL-20260921, github.com/mrdoob/three.js/releases, threejs.org/manual/en/webgpurenderer, github.com/mrdoob/three.js/issues/30560, threejs.org/docs/pages/SSGINode.html, threejs.org/docs/pages/VXGINode.html, blogs.windows.com/blog/2026/03/26/announcing-babylon-js-9-0, unpkg.com/three-gpu-pathtracer@0.0.27/README.md, mediabunny.dev.

Visualisation and audio: pnnl.gov (cividis), research.google/blog/turbo-an-improved-rainbow-colormap-for-visualization, flowvis.org (schlieren and shadowgraph), arxiv.org/pdf/1902.11213 (photoelasticity), cs.mcgill.ca/~kry/pubs/foleyautomatic/foleyautomatic.pdf, developer.chrome.com/blog/audio-worklet-design-pattern, research.cs.cornell.edu/HarmonicFluids, github.com/GoogleChrome/omnitone, gameaccessibilityguidelines.com.

Testing and Claude Code: anthropic.com/engineering/effective-harnesses-for-long-running-agents, anthropic.com/engineering/building-c-compiler, anthropic.com/engineering/harness-design-long-running-apps, anthropic.com/engineering/demystifying-evals-for-ai-agents, code.claude.com/docs/en/best-practices (and the hooks, skills, sub-agents, goal, checkpointing, headless and github-actions pages), github.com/microsoft/playwright-mcp, github.com/microsoft/playwright-cli, github.com/ChromeDevTools/chrome-devtools-mcp, npmjs.com/package/webgpu, developer.mozilla.org/docs/Web/API/GPUDevice/lost, gafferongames.com/post/fix_your_timestep, codeberg.org/perplexdotgg/bounce/issues/8, webassembly.org/docs/nondeterminism, fast-check.dev, github.com/facebook/memlab, github.com/gzuidhof/coi-serviceworker, github.com/orgs/community/discussions/13309, developers.cloudflare.com/pages/configuration/headers, gltf-transform.dev/cli.

Game design and learning: store.steampowered.com (review API per app), vaporlens.app, oxygennotincluded.wiki.gg/wiki/Thermal_Conductivity, 80.lv/articles/noita-a-game-based-on-falling-sand-simulation, gamedesignskills.com/game-design/why-did-kerbal-space-program-2-fail, biggieblog.com/tracking-the-global-opus-magnum-records, kodub.itch.io/polytrack devlogs, maxbittker.com/making-sandspiel, per-central.org/perc/2013/Detail.cfm?id=5248, myweb.fsu.edu/vshute/pdf/ETRD2023.pdf, pmc.ncbi.nlm.nih.gov/articles/PMC12179260 (Kestin et al. 2025), web.dev/blog/webgpu-supported-major-browsers.
