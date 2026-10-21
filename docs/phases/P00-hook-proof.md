# P00 evidence: hooks, scoped rules, subagents and skills

Gate item 9 asks for evidence that the Claude Code setup in MASTER 13.5 works. Each section says how the evidence was obtained. Compiler output is quoted exactly, so those lines carry the content lint's `lint-allow` marker.

## PostToolUse hook (live session)

Live Claude Code session in the desktop app, 21/10/2026. The hook in `.claude/settings.json` runs `node tools/hooks/post-edit.js` after every Edit, Write and MultiEdit.

WP0.8 scratch-branch proof: a branch `scratch/hook-proof` was created from main (commit 20d348e).

1. The Edit tool added `export const HOOK_PROBE: number = 'not a number';` to src/sim/version.ts. The hook blocked with exit 2 and returned: `src/sim/version.ts(8,14): error TS2322: Type 'string' is not assignable to type 'number'.`
2. The Write tool created src/gpu/kernels/hook-probe.wgsl containing `let x: f32 = 1u;`. The hook blocked with exit 2 and returned: `ERROR .../hook-probe.wgsl:4:7 cannot initialize 'let' of type 'f32' with value of type 'u32'` (lint-allow)
3. Both changes were reverted, the session switched back to main, and `git branch -D scratch/hook-proof` deleted the branch.

The hook also caught real mistakes during normal work the same day, for example a half-finished edit of src/render/renderer.ts (`error TS2339: Property 'onRecoveryFailed' does not exist on type 'SceneRenderer'`) and a protocol change that the worker did not yet satisfy (`error TS2739 ... missing the following properties from type 'FrameResult': hashTick, replay`). Clean edits passed silently.

## Stop hook (live session)

20/10/2026, live session: when the agent tried to end a turn, `node tools/hooks/stop.js` ran verify:fast, which failed under heavy machine load (another project's screenshot jobs; load average 56), and the hook blocked the stop with this feedback:

```
[node tools/hooks/stop.js]: verify:fast failed. Fix it before stopping, or if it cannot be fixed this session, commit to a wip/ branch and only docs/PROGRESS.md to main (MASTER 3.3). Full log: reports/verify-fast.log
FAIL unit tests               151.2 s
verify:fast FAILED (1 steps) in 177.4 s (budget 90 s)
```

The agent investigated (the acos accuracy test timed out at 60 s under load and passed in 2.3 s alone), reran verify:fast (passed in 24.9 s) and recorded the lesson in docs/LEARNINGS.md; the next stop went through. The gate reviewer found the Stop hook in this project's Claude Code log 11 times, about 38.6 s each, one of them blocking. By direct invocation on 15/10/2026, `{"stop_hook_active": true}` on stdin makes the hook exit 0, so a second stop always goes through.

## Scoped rules (live session)

21/10/2026: on the first edit of a file under src/sim (src/sim/core/simulation.ts), Claude Code loaded `.claude/rules/sim.md` (frontmatter `paths: src/sim/**`) into the agent's context. On the first write of a .wgsl file it loaded `.claude/rules/gpu.md` (`paths: src/gpu/**, **/*.wgsl`). Neither file was loaded for edits elsewhere. `.claude/rules/content.md` (`paths: content/**`) has had no trigger because content/ is still empty in P00.

## Subagent (live session)

The project subagent `gate-reviewer` (.claude/agents/gate-reviewer.md) ran in a fresh context from 20/10 to 21/10/2026 (subagent type "gate-reviewer", tools Read, Grep, Glob and Bash as its frontmatter says). It ran `node tools/gate.ts P00 review`, played the build through Playwright, wrote docs/phases/P00-review.md, filed defects D-002 to D-010 in docs/DEFECTS.md and recommended fail. The other four project subagents (physics-auditor, mission-critic, qa-player, perf-auditor) are listed by Claude Code as available agent types in the same session but have not been run in P00.

## Direct invocation of the hooks (15/10/2026)

PostToolUse on tests/unit/__hook_probe__.ts (type error): exit 2
```
post-edit hook: check failed for /Users/TheDonDurk/Library/Application Support/Claude/scratch-workspaces/1803f982-ff8e-4099-81d0-b4cf33a49118/87c94706-8061-404f-abb1-681c31d0bc0b/scratch-2026-10-15-c1401f/tests/unit/__hook_probe__.ts
tests/unit/__hook_probe__.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.
```

PostToolUse on src/gpu/kernels/__hook_probe__.wgsl (invalid WGSL): exit 2
```
post-edit hook: check failed for src/gpu/kernels/__hook_probe__.wgsl
ERROR src/gpu/kernels/__hook_probe__.wgsl:3:7 cannot initialize 'let' of type 'f32' with value of type 'u32'
```
