---
name: new-bench
description: Add a physics validation bench with frozen parameters and a negative control. Use when implementing a model listed in MASTER section 6.
---
1. Add the bench parameters to tests/validation/benches.json under its id (M7, T3 and so on). Parameters are frozen; changing one later needs Ricky's approval.
2. Write tests/validation/<domain>/<id>-<slug>.test.ts: build the scene through the game's own Simulation, measure with the system around the model (not the model's own formula), compare to the analytic or published value within the MASTER tolerance.
3. Add a negative control `it` that breaks the physics deliberately and asserts the check fails.
4. Cite the bench id in the model card (docs/model-cards/) and in the DomainModule's modelCards().
5. Run `npm run test:validation` and record the measured error in the feature's evidence.
