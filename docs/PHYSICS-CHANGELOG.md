# Physics changelog

physicsVersion follows semantic versioning (MASTER 5.5). Any change that alters a golden hash bumps it and is listed here. Golden files in tests/golden/ change only with an entry here.

## 0.1.0 - 15/10/2026

First version. Mechanics only: Rapier 0.21.0 deterministic-compat, tick 1/120 s, two substeps, gravity 9.80665 m/s^2, cuboids and balls, Rapier default solver parameters. Golden replay cube-drop (seed 1, 1200 ticks, hash every 60): final hash 3374e5261804bf27.
