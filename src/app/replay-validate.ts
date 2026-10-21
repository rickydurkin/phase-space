// Replay files cross a trust boundary (files, share links, the test API) on the
// main thread, so they are validated here with the zod schema (MASTER 5.5)
// before they reach the simulation worker. Keeping zod out of the worker keeps
// the worker chunk inside its size budget.
import { ReplayFileSchema } from '../content/schemas/replay.ts';
import type { ReplayFile } from '../sim/index.ts';

export function parseReplayFile(replayJson: string | ReplayFile): ReplayFile {
  const value: unknown = typeof replayJson === 'string' ? JSON.parse(replayJson) : replayJson;
  const parsed = ReplayFileSchema.safeParse(value);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`invalid replay file: ${issues.join('; ')}`);
  }
  return parsed.data as ReplayFile;
}
