# P07 - Replayability

Programme v1.0.0. Prerequisite: P06 gate closed. Typical length: 5 to 8 sessions.

## Goal

Turn five realms of content into a game people come back to for months. This phase builds the modes that make the coupled world replayable: the Forensics Bureau, Chain Reaction, Constants Run, Futures missions with Monte Carlo instruments, the Evolution Bench, the weekly Grand Challenge, mission authoring from The Lab, and sharing of ghosts and clips.

## What Ricky can do at the end

Solve a forensic case with a different hidden truth each attempt; build a Chain Reaction that passes through six domains and see its score multiply (sound makes it seven in P8); survive eight rounds of a Constants Run on a world with slow sound and sticky floors; evolve a better trebuchet overnight; turn a Lab build into a mission and send it to a friend with a ghost to beat.

## Read first

- MASTER Part A; sections 4.4, 7, 8 and 9.
- LEARNINGS.md entries for Ten Thousand Futures, Genetic Garage, M6 Keep Left (common random numbers) and Stability Triangle (what-if bisection).
- MISSION-CATALOGUE.md: Forensics Bureau, Chain Reaction, Constants Run law cards, Daily templates.

## Work packages

### WP7.1 Generator framework v2

Generalise the Daily pipeline into a template system any realm can use: parameter ranges, layout chunks, objective templates, reference solver hooks (analytic or optimiser), necessity bots, difficulty estimation from bot success rates and solution margins. Add the weekly Grand Challenge (Optimise mode, a harder template, histograms only). CI proves the 400-day manifest of Dailies and Weeklies across R1 to R5 (MASTER section 8).

### WP7.2 Forensics Bureau

Case-file mode: the player arrives after the event and sees only evidence (rest positions, skid marks, crush depth, char patterns, water marks, meter readings). The true initial conditions are drawn from a seeded distribution each attempt and simulated in the AS to produce the evidence. The player measures with instruments and submits an answer with units; scoring is by error and by whether the method shown in the notebook used the right physics. Seven cases, FB-01 to FB-07, from the catalogue; FB-08 needs the entry models and ships in P10.

### WP7.3 Chain Reaction

The ledger already books every energy transfer with a cause ID. Build a causal-chain tracker on top: from the trigger event to the goal event, find the chain of hand-offs and the distinct domains it passes through. Score as defined in MASTER section 8 (base x 1.5^(k - 1) x efficiency, with efficiency measured against the declared sources). Puzzles CR-01 to CR-03 and the free mode CR-05 with personal bests; CR-04 needs seven domains and ships in P8. A chain visualiser replays the chain with each hand-off highlighted.

### WP7.4 Constants Run

A roguelite run of generated missions. After each success the player picks one of three Law cards (LC-01 to LC-20 in the catalogue), each changing a constant or a material property and carrying its reality badge. Generated missions must pass the necessity checks under the current laws, so the generator runs its proofs with the active cards, in the browser: 50 bot attempts per guessing check, accepting the mission only if at most one succeeds, within 10 s; when time runs out it draws from a pool proven in CI. The run ends at the first failure; seeds are shareable; a daily run uses the date as seed.

### WP7.5 Futures missions and Monte Carlo instruments

Ensembles run in the headless worker pool with common random numbers (the M6 Keep Left technique) so designs are compared fairly. Instruments from Ten Thousand Futures: a fan chart of trajectories, percentiles (P10, P50, P90), a histogram of outcomes, tornado sensitivity and a convergence plot with a 95% band. Upgrade the margin-to-failure tool to run in the pool. Convert at least one mission per realm into a Futures variant.

### WP7.6 Evolution Bench

The player marks parameters as free (dimensions, angles, masses, materials, spring constants), picks a fitness from the observation bus, and runs a genetic algorithm or CMA-ES across the headless pool. Show generations, the best design so far as a ghost, and the fitness curve. Champions export to The Lab. Runs are seeded and resumable. Genetic Garage stalled at 144 Hz because it stepped once per frame; here the bench runs headless and frame-rate independent.

### WP7.7 Authoring and sharing

- Lab to mission: the objective editor (a visual builder over the objective DSL), allowed parts and budget, star thresholds, hints. Publishing locally requires a recorded passing solution and runs the guessing bot.
- Share links v2: mission plus ghost in the URL fragment where it fits; a file otherwise.
- Clip export: re-simulate the replay at a fixed frame rate (optionally path-traced), render audio with OfflineAudioContext from the same event log, and mux with Mediabunny through WebCodecs. Lossy codecs change pixels, so check sampled frames by PSNR against the re-rendered frames rather than by hash.

### WP7.8 Achievements v2 and reference histograms

Achievements for insight across modes (forensic answers within 2%, a six-domain chain, a ten-round Constants Run). Ship reference histograms generated by bots and development runs for every mission.

## Benches

Generator determinism (the same date gives the same mission on every machine); causal-chain tracker tests on hand-built chains; Monte Carlo convergence tests (known distributions recovered within statistical tolerance); optimiser tests on analytic functions.

## Missions and content

FB-01 to FB-07, CR-01 to CR-03 and CR-05, LC-01 to LC-20, at least one Futures variant per realm R1 to R5, the Weekly Grand Challenge template.

## Gate

- [ ] CI has proven the 400-day manifest (Dailies for R1 to R5 and Weeklies), and the 30 Dailies from the date fixed in the plan pass missions:verify in full.
- [ ] Every Forensics case passes necessity checks with randomised truths (the guessing bot fails, the reference method succeeds across 200 seeds).
- [ ] The chain tracker scores a scripted six-domain chain exactly as computed by hand.
- [ ] A Constants Run of ten rounds generated with random cards passes verification at every round.
- [ ] Evolution Bench improves a trebuchet's range by at least 20% over the preset within a set budget, deterministically from its seed.
- [ ] Clip export of a 20 s replay produces an MP4 whose sampled frames match the re-rendered frames at a PSNR of at least 40 dB.
- [ ] Regression (automated items of earlier gates) and zero console errors.

## Ricky's playtest (40 minutes)

1. Two Forensics cases.
2. A Chain Reaction of your own design through at least five domains.
3. A Constants Run until you fail.
4. Export a clip of your best moment and share a ghost link with a friend.
5. Which mode would you come back to tomorrow, and why?

## Out of scope

Online leaderboards and accounts (P12), multiplayer.

## Risks and mitigations

- Generated content that is dull: keep hand-authored chunks for layout, score candidates by bot difficulty and solution margin, reject the bottom quartile.
- Monte Carlo cost: cap ensemble sizes per tier and show convergence so players see when more runs stop mattering.

## Stop and ask Ricky if

He wants any mode cut or any mode promoted to the front page.
