# P11 - Release hardening: v1.0

Programme v1.0.0. Prerequisite: P10 gate closed. Typical length: 4 to 6 sessions.

## Goal

Make v1.0 something Ricky can hand to anyone without caveats. No new systems: performance on every tier, cross-browser behaviour, accessibility, onboarding polish from all the playtest notes so far, audio mix, visual consistency, content review of every mission, documentation, and a retrospective that feeds the next version of this programme.

## What Ricky can do at the end

Send the link to friends and family on whatever they use, knowing it loads quickly, plays well, never loses work and explains itself.

## Read first

- MASTER Part A; sections 10, 12 and 13.
- Every docs/playtests/ note and every open item in docs/DEFECTS.md and docs/IDEAS.md.

## Work packages

### WP11.1 Performance

Re-measure every reference scene and the stress scene on the M4 Max (perf:mac), on an M1 or M2 class machine if Ricky has access to one, and on the WebGL2 fallback. Fix every budget miss with traces from the perf-auditor subagent. Long-task audit after first paint. Bundle and asset audit against size budgets; lazy-load realms.

### WP11.2 Cross-browser

Chrome, Edge, Safari (26 and 27) and Firefox (147 and later) on macOS; Chrome and Edge on Windows; Safari on iPad as a stretch goal. Feature detection rather than browser sniffing. Golden replays have run across engines in CI since P0; here they also run in the real shipping browsers on Ricky's Mac and on the nightly macOS and Windows runners. Any difference is a defect.

### WP11.3 Accessibility

Full axe-core pass; keyboard-only completion of the tutorial and one mission per realm; screen-reader labels for menus and readouts; reduced motion everywhere; colour-independent cues in every instrument; captions for sound events; text scaling.

### WP11.4 Onboarding and feel

Act on every playtest note so far. Re-measure time to first fun with someone who has never seen the game, if Ricky can arrange it. Tighten copy across the game to the clean en-GB style: short sentences, numbers with units, no long dashes.

### WP11.5 Audio and visual polish

A full mix pass (levels, ducking, limiter), consistency of materials and lighting across realms, photo-mode presets, loading screens that show something true (a model card fact or a codex entry).

### WP11.6 Content review

Re-run missions:verify on everything. The mission-critic subagent replays every mission cold and flags clarity issues; fix or document. Check every model card for accuracy and every data table for sources.

### WP11.7 Reliability

The 30-minute soak on every realm; save migration tests from every earlier save version; offline play after first load; device-loss recovery in every realm; crash reporting that stays on the device (no tracking).

### WP11.8 Documentation and release

An in-game manual (controls, modes, instruments, honesty layer), credits and third-party licences, release notes, the v1.0.0 tag and deployment.

### WP11.9 Retrospective

Write docs/RETROSPECTIVE-v1.md: what worked in this programme, what did not, what the gates caught, what slipped past them, and the top ten changes for the next version of programme/. This is the main input to programme/UPGRADE-PROMPT.md.

## Gate

The full MASTER section 12 table, every row, with evidence, plus:

- [ ] Golden hashes identical across all supported browsers.
- [ ] Zero open defects of severity high or above; every lower one triaged.
- [ ] The retrospective exists.
- [ ] Ricky signs off the release.

## Ricky's playtest (60 minutes)

Play anything for an hour. Then hand it to someone else for 20 minutes and watch without helping. Record where they got stuck.

## Out of scope

New features. Every idea goes to docs/IDEAS.md for the next version.

## Stop and ask Ricky if

A budget cannot be met without cutting content he cares about.
