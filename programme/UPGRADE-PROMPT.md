# Upgrade prompt: improving this programme over time

Programme v1.0.0, 14/10/2026. Run this between phases, after the v1.0 release, or whenever new technology or better ideas appear (a new physics engine, a WebGPU feature, a new Claude model or Claude Code feature, a game that raises the bar). It works in Claude Code inside the game repository, or in a Claude chat with web search if you attach the programme folder.

## The prompt

```
You are upgrading the PHASE SPACE programme pack (the programme/ folder) from its current version to the next one. In this task, and only in this task, you may edit files in programme/.

Inputs:
- programme/ and programme/CHANGELOG.md.
- If the game repository exists: docs/LEARNINGS.md, docs/DEFECTS.md, docs/IDEAS.md, docs/playtests/, docs/phases/*-report.md, docs/adr/, docs/research/ and any docs/RETROSPECTIVE-*.md.
- My notes for this upgrade (may be empty):

Steps:
1. Research refresh. For every topic in the latest programme/reference/RESEARCH-SNAPSHOT-*.md, find what has changed since its date: package versions on npm, physics engines and GPU solvers (GitHub releases and papers), WebGPU features in each browser, three.js and its alternatives, testing tools, Claude Code features, and notable physics games and open-source simulators. Search GitHub and the web; use subagents for breadth. Write a new dated snapshot with sources and mark anything you could not verify.
2. Harvest the build. From the inputs, list what the gates caught, what slipped past them, what I enjoyed and disliked in playtests, recurring defects, and ideas worth promoting from docs/IDEAS.md.
3. Propose. Write a change list. For each change give the reason, the evidence, the effect on work already built, the risk and its class (MAJOR, MINOR or PATCH, as defined in MASTER section 16.3). Add missions, instruments, modes or realms only if they serve a pillar in MASTER section 4.2.
4. Ask me to approve every MAJOR change, and any change that would lower a quality gate, before applying it. Never lower a gate without my approval and a stated reason.
5. Apply. Update MASTER.md, the phase files, the mission catalogue and the reference documents. Keep IDs stable; mark removed items as retired rather than reusing their IDs. Update the version and date (DD/MM/YYYY) in every file header you change.
6. Record. Add a CHANGELOG entry and a short "What changed" summary for me. If the game repository exists, list the follow-up work the changes imply as proposed docs/features.json entries (do not edit docs/ yourself).
7. Check. Re-read every changed file for contradictions with MASTER Part A. Scan for long dashes, curly quotes, ellipsis characters and emoji, and fix any you find. British English throughout.
```

## Good moments to run it

- At the end of every phase, with that phase's report and playtest notes as input. This keeps the lessons flowing into the remaining phases.
- After P11 (v1.0), with docs/RETROSPECTIVE-v1.md as the main input.
- When a watch-list item in MASTER section 11 changes status, for example Box3D gaining JavaScript bindings or WebGPU gaining float atomics.
