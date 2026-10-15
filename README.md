# PHASE SPACE

A deterministic 3D multi-physics sandbox for the browser, built phase by phase from the programme in programme/ (start with programme/README.md). Working title; rename freely.

Status: Phase 0 (foundations) in progress. See docs/PROGRESS.md for the current state, docs/phases/ for plans and reports, and CLAUDE.md for the commands.

Quick start on a Mac with Node 26:

```bash
npm ci
npm run verify:fast
npm run build:test && npm run preview
```

Then open http://localhost:4173/ in Chrome or Safari. Press R to replay the run and compare hashes.
