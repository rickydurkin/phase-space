---
name: run-game
description: Build and run PHASE SPACE locally with the test API, for manual or automated play. Use when you need to see or drive the game.
---
1. `npm run build:test` builds to dist-test/ with `VITE_TEST_API=1` so `window.__ps` exists.
2. `npx vite preview --outDir dist-test --port 4173 --strictPort` serves it; open http://localhost:4173/ (add `?webgl=1` for the WebGL2 fallback). The headless replay page is http://localhost:4173/replay.html.
3. For development with hot reload: `npm run dev` (http://localhost:5173/).
4. Drive it from Playwright with the WebGPU flags in MASTER 13.3, or by hand: R replays and compares hashes, Space pauses, drag orbits, pinch zooms.
5. Stop the server when done; never leave a preview running at the end of a session.
