---
name: new-mission
description: Add a campaign mission from the catalogue with reference and trap solvers and the necessity proof. Use when a phase calls for missions (P2 onwards).
---
1. Pick the mission from programme/reference/MISSION-CATALOGUE.md; keep its id.
2. Copy the schema example in programme/MASTER.md Appendix B to content/missions/<id>.json and fill every field in en-GB.
3. Write solvers in content/missions/solvers/: at least one reference, one trap. Solvers read only what the allowed tools show.
4. Run `npm run missions:verify -- <id>` until: goal not met at setup, references pass with margin, traps fail, the guessing bot's success rate is under the stated maximum (MASTER 7.6).
5. Add the feature entry to docs/features.json (passes false until the verifier is green) and ask the mission-critic subagent to play it cold.
