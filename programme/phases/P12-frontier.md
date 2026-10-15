# P12 - Frontier (optional menu)

Programme v1.0.0. Prerequisite: v1.0 released (P11 gate closed). Ricky picks items from this menu; each runs as its own mini-phase with a plan, features, a gate and a playtest. Run the research refresh first, because this is where newer technology matters most.

## F1 The Edge: slow light

A realm where the speed of light is set to tens of metres per second, so special relativity becomes visible: aberration, Doppler colour shift, the searchlight effect, time dilation on every clock and the Terrell-Penrose appearance of fast objects. It runs under its own AS rules (relativistic mechanics in this realm only), clearly badged Impossible for the value of c and Real for the physics.

- Lineage: Worldline (rapidity-based closed forms, exact clock offsets, reality badges) and MIT's A Slower Speed of Light.
- Missions: a twin race with proper-time scoring, a delivery that arrives "before" it was sent in someone's frame, catching a fast object you can see but not where it is.
- Benches: time dilation, Doppler factor and aberration angle against closed forms within 1e-9.
- Gate: all benches; golden determinism; the relativistic shader matches the CPU reference for sampled pixels.

## F2 Global leaderboards

Accounts are optional nicknames only. Submissions are replays; a server (for example a Cloudflare Worker with D1) re-simulates them with the same AS build in Node before accepting, checks input plausibility (no superhuman timing), and keeps boards per mission version and physics major version. No personal data beyond the nickname.

- Needs Ricky's approval for accounts and any cost.
- Gate: tampered replays are rejected in tests; a load test of 1,000 submissions; a privacy note in the game.

## F3 AI lab assistant

An opt-in tutor grounded in the game's own data: the mission brief, model cards, the player's run from the recorder, and the reference solutions. It asks questions and gives hints in the Socratic style; it never hands over a solution unless the player asks and accepts losing the insight star. A 2025 randomised trial with physics students found that an AI tutor grounded in pre-written expert solutions more than doubled learning gains, which is the design to copy.

- Uses the player's own Anthropic API key, stored only on their device, with a clear warning about browser key storage. Check the current Claude API, models and browser-access requirements at the time of building.
- Transcripts stay local. Off by default.
- Gate: the assistant never reveals a reference solution in 200 adversarial prompts; it cites the model card it relied on; it works offline-gracefully (switches itself off).

## F4 WebXR Lab

The Lab in a headset (three.js added WebXR support to the WebGPU renderer in r185). Hand-tracked building, life-size experiments, comfort settings. Gate: 90 fps in the target headset on reference scenes with a reduced tier.

## F5 Mod API

Physics packs and missions as sandboxed modules implementing the DomainModule interface, verified by the same benches and necessity checks before they load. A signed manifest and a permissions model. Gate: a sample community pack passes verification; a malicious pack is contained in tests.

## F6 Multiplayer

Asynchronous ghost races first. Then co-op Lab sessions using deterministic lockstep: only inputs travel over the network, because the AS is deterministic. Gate: two browsers on different machines stay hash-identical for 30 minutes of co-op building.

## F7 GPU authoritative research

Investigate a per-device-deterministic GPU MPM (fixed-point scatter, sorted constraint lists, custom polynomial trig instead of WGSL built-ins) for missions scored locally, and track Box3D and Dimforge Nexus for GPU or WASM rigid bodies. Outcome: an ADR with measurements, adopted only if it keeps every guarantee in MASTER section 2.

## F8 New domains

Candidates, each to pass the same bar as the core domains: radioactivity and shielding with a Geiger counter instrument; simple chemistry (reactions with enthalpy and gas laws); superconductivity and the Meissner effect (badged appropriately); plasma and auroras with charged particles in planetary fields.

## For every frontier item

Plan, features, benches, missions where relevant, gate, playtest, and an update to docs/LEARNINGS.md. Nothing here may weaken the non-negotiables.
