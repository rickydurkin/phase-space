---
name: phase-gate
description: Run a phase gate, write the report, and prepare Ricky's playtest. Use at the end of a phase (MASTER 3.4).
---
1. `npm run gate PNN` runs every check the phase gate needs and writes docs/phases/PNN-report.md from the template in MASTER Appendix D. Fix anything red first; never weaken a check.
2. Ask the gate-reviewer subagent, in a fresh context, to refute the report (`npm run gate PNN review` writes PNN-review.md).
3. Resolve or record each finding. Waivers need Ricky's written approval, recorded in the report.
4. Build the playtest version (`npm run build:test`) and copy the checklist from the phase file into the report.
5. Report to Ricky in the MASTER 3.6 format and wait for "close PNN" before tagging v0.N.0 or starting the next phase.
