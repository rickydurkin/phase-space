# Learnings

One line per surprise. These feed the next programme version (MASTER 16.2).

- 15/10/2026: V8 on Apple Silicon fuses multiply-add in its fdlibm-derived Math functions, so a pure-JavaScript port of the same algorithms differs from Math.sin and friends by 1 to 2 ulp on about 1% of inputs. That is the cross-platform variation dmath removes, and a reminder never to use Math.* as a reference.
- 15/10/2026: decimal.js built from a double's shortest round-trip string is not an exact reference: subnormals have few significant digits and x near 1 raised to a huge power amplifies the string's rounding by the exponent. Build references from the double's bits (tests/helpers/dmath-ref.ts, exact()).
- 15/10/2026: typescript-eslint's scope manager resolves lib globals such as Date and performance, so an ESLint rule that only inspects unresolved references misses them; check the global scope's variables too.
- 15/10/2026: Dawn's native module (webgpu 0.6.2) segfaults inside Vitest's forked worker but runs cleanly under plain Node and node:test (ADR 0003).
- 15/10/2026: Rapier JavaScript handles are doubles whose bit pattern encodes the arena index and generation (the second body's handle prints as 5e-324). Never do arithmetic on them; store them as raw f64 bits in snapshots.
- 15/10/2026: npm 11.19 no longer runs install scripts by default; the webgpu package's postinstall (quarantine attribute removal on macOS) did not run and was not needed.
- 15/10/2026: bitECS 0.4 cannot restore an entity under a chosen id without its remapping serialiser, which conflicts with stable ids (ADR 0002).
