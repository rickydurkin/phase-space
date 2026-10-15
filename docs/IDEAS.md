# Ideas

Outside the current scope; carried on without acting (MASTER 3.2).

- Ledger window frames at tick granularity cost about 40 bytes per tick in every snapshot (48 KB at a full 10 s window). If snapshot rings get heavy, aggregate frames per 1/10 s or store running sums.
- The frame clock's achieved-rate signal could drive the "interpolated" badge (MASTER 5.3) once the time scale UI exists.
- A dmath cost table in the Lab Book, so curious players see what determinism costs.
