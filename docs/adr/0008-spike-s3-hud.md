# 0008 Spike S3: HUD library (React with Zustand against Preact signals)
Status: accepted (15/10/2026)

Context: MASTER 11 defaults the UI to React 19 with Zustand, fed at 10 to 20 Hz, and lets an ADR choose Preact signals or Solid if HUD cost exceeds 1 ms per frame. S3 measures the main-thread cost of updating 200 readouts at 20 Hz.

Measurement (tools/spikes/s3-hud.ts, reports/spike-s3.json, headless Chromium through Playwright, Chrome DevTools Performance metrics, two interleaved runs of 10 s per variant, M4 Max under concurrent load on 15/10/2026):

| Variant | Main thread ms per update | Script | Layout | Style | JS heap |
|---|---|---|---|---|---|
| React 19.3.1 with Zustand 5.0.15, run 1 | 3.02 | 0.55 | 1.11 | 0.00 | 3.3 MB |
| Preact 11.0.1 with signals 2.11.3, run 1 | 1.74 | 0.26 | 0.70 | 0.00 | 2.7 MB |
| React with Zustand, run 2 | 2.26 | 0.42 | 0.89 | 0.00 | 4.7 MB |
| Preact signals, run 2 | 2.10 | 0.31 | 0.86 | 0.00 | 3.7 MB |

At 20 updates per second the main-thread cost per rendered frame at 60 Hz is about 0.75 to 1.0 ms for React with Zustand and 0.58 to 0.70 ms for Preact signals. Layout dominates both: 200 text nodes changing width each update. React's script cost is roughly twice Preact's.

Decision: Preact with signals for the HUD and panels from P1. React with Zustand sits at the 1 ms per frame threshold in the first run and Preact is consistently cheaper and smaller. The P00 HUD stays plain DOM (six readouts). Either library would need the same layout discipline: fixed-width readouts (tabular figures, min-width) so value changes do not relayout the panel; that is the larger win and is a P1 task.

Consequences: react, react-dom and zustand are removed from devDependencies after P00 (they exist only for the spike); preact and @preact/signals move to dependencies in P1. Watch: Preact 11 is new; if its signals integration regresses, Solid is the fallback named in MASTER 11.

Verification: `node tools/spikes/s3-hud.ts` reproduces the measurement.
