# PHASE SPACE programme pack

Version 1.0.0, 14/10/2026.

This pack is a reusable master prompt and a set of phase prompts for building PHASE SPACE (a working title) with Claude Code: a 3D physics sandbox where mechanics, heat, fluids, electricity and magnetism, light, gravity and sound share one world and affect each other, with a campaign of missions that can only be won with the right physics. It draws on a review of your 31 published simulators and on GitHub and web research carried out on 14/10/2026.

## What is in the pack

| File | What it is | Who reads it |
|---|---|---|
| README.md | this page | you |
| KICKOFF-PROMPT.md | the four prompts you paste into Claude Code | you |
| MASTER.md | the master prompt and specification: rules, design, architecture, physics, missions, quality bar, verification | Claude Code, every session |
| phases/P00 to P12 | one prompt per phase, each ending in a hard gate and a playtest for you | Claude Code, one at a time |
| reference/LEARNINGS.md | what your existing sims taught us: what you value, what broke, what to reuse | Claude Code, and you if curious |
| reference/RESEARCH-SNAPSHOT-2026-10-14.md | the dated state of the art, with versions and sources | Claude Code |
| reference/MISSION-CATALOGUE.md | 96 campaign missions, 8 forensic cases, 5 Chain Reaction puzzles, 28 Daily templates and 20 Law cards, each mission with the physics that wins and the trap it catches | Claude Code, and you |
| UPGRADE-PROMPT.md | the prompt that produces the next version of this pack | you, between phases |
| CHANGELOG.md | version history of the pack | both |

## How to start

1. Create an empty GitHub repository. Decide whether it is public or private first: GitHub Pages needs a paid plan for private repositories.
2. Clone it to your Mac and copy this whole folder into it as programme/.
3. Open Terminal in the repository, start Claude Code with `claude`, and paste the session prompt from KICKOFF-PROMPT.md.
4. Claude will ask three setup questions (visibility and licence, where it is running, the game's name), then build Phase 0.

Running Claude Code on your Mac is best: it can use the real GPU for performance checks. If you use Claude Code in the cloud instead, you will be asked to run `npm run perf:mac` on the Mac at each phase gate.

## Every session after that

Paste the same session prompt. Claude reads its progress notes, runs the checks, fixes anything broken first, carries on with the next feature and reports back in a short, fixed format.

## At the end of each phase

1. Open a fresh session and paste the gate review prompt. A separate reviewer tries to prove the phase is not done.
2. Play the build with the checklist at the bottom of that phase's file (10 to 60 minutes).
3. Paste your notes with the playtest prompt.
4. When the gate passes and your notes are dealt with, write "close PNN" (for example "close P03"). Only then does the phase close and the next one start.

## What to expect

Twelve phases to v1.0 (P0 to P11), roughly 50 to 90 Claude Code sessions in total, plus an optional menu of frontier work (P12). Every phase ends with a playable, deployed game, so you can stop at any point and still have something good. Phase 1 alone gives you a mechanics sandbox; Phase 2 makes it a game.

"Flawless" is defined in measurable terms in MASTER.md section 12: deterministic replays across machines and frame rates, every physics bench inside tolerance, every mission proven to need the right physics, zero console errors, 120 fps at Ultra on your M4 Max in the reference scenes, and a game that never loses your work.

## Keeping it current

Run UPGRADE-PROMPT.md at the end of each phase, after v1.0, or when something new lands (a physics engine, a WebGPU feature, a Claude Code feature, a game that raises the bar). It researches what has changed since the last snapshot, folds in what the build has taught, asks you to approve the big changes, and writes the next version with a changelog entry.
