# Ideas

Outside the current scope; carried on without acting (MASTER 3.2).

- Ledger window frames at tick granularity cost about 40 bytes per tick in every snapshot (48 KB at a full 10 s window). If snapshot rings get heavy, aggregate frames per 1/10 s or store running sums.
- The frame clock's achieved-rate signal could drive the "interpolated" badge (MASTER 5.3) once the time scale UI exists.
- A dmath cost table in the Lab Book, so curious players see what determinism costs.
- Switch from the Rapier -compat build (inlined base64 WebAssembly, 1.59 MB gzip in the worker chunk) to the plain -deterministic build with the .wasm served as one asset, once Vite's wasm handling is checked for determinism; expected bundle under 1 MB gzip.
