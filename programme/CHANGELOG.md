# Changelog

Versioning follows MASTER.md section 16.3: MAJOR for pillars or architecture, MINOR for new phases, sections or research, PATCH for clarifications.

## 1.0.0 - 14/10/2026

First version.

- MASTER.md: brief, 14 non-negotiables, session protocol, game design (pillars, modes, 12 realms, progression, onboarding), simulation architecture (authoritative CPU simulation and GPU detail layer, time, determinism, coupling matrix, energy ledger, handoff), ten physics domains and kits with 74 named validation benches (plus two stretch benches), each with frozen parameters and a negative control, the mission framework with ten necessity checks, replayability systems, instruments and the honesty layer, presentation, technology stack checked against npm, quality bar, verification system and Claude Code configuration, phase plan, and the programme's own refresh and versioning rules.
- Phase prompts P00 to P12, each with goals, work packages, benches, content, a hard gate, a playtest checklist, risks and stop conditions.
- Reference: learnings from a review of 31 of Ricky's simulators (static review, smoke test, Mach Cone's own test suites); research snapshot of 14/10/2026 with sources; mission catalogue with 96 campaign missions, 8 forensic cases, 5 Chain Reaction puzzles, 28 Daily templates, 20 Law cards and a codex seed list.
- KICKOFF-PROMPT.md (session, gate review, playtest and course-correction prompts) and UPGRADE-PROMPT.md.
- Before release, an independent review (engineering, physics, game design and prompt reliability) found three blocking and twelve important issues. All were fixed: a bootstrap step so session two cannot restart Phase 0; an allowlist for maths in the simulation plus cross-engine golden replays from Phase 0; per-domain clocks (circuits, charged particles, light, orbits); stricter gate integrity (ADRs cannot move numbers without Ricky, golden files only change with a physics version bump, phases close on Ricky's word); an energy ledger that can actually fire; mission margins, randomised inputs, per-mode guessing bots and a model-coverage check; phase-ordering fixes; missing models added; physics corrections (Mars triple point, damped resonance peak, Earth-Moon L1, eddy brakes on a slope); measurable performance gates; CI cost controls and a 400-day Daily manifest; harness fixes for the Stop hook and plan mode.
