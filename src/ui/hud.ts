// HUD stub for P00 (WP0.5): fps, AS step time, tick, sim time, hash, backend,
// time scale, the "running below real time" badge and the replay status line.
// Plain DOM, updated by the caller at about 20 Hz. UK English, plain hyphens.

import './hud.css';

export interface HudData {
  readonly fps: number;
  readonly asMs: number;
  readonly tick: number;
  readonly simTime: number;
  readonly hash: string;
  readonly backend: string;
  readonly timeScale: number;
  readonly belowRealTime: boolean;
  readonly paused: boolean;
}

export type ReplayState = 'idle' | 'busy' | 'ok' | 'bad';

const HELP = 'R replay, Space pause, drag orbit, pinch zoom';

export class Hud {
  readonly root: HTMLDivElement;
  private readonly values = new Map<string, HTMLSpanElement>();
  private readonly badge: HTMLSpanElement;
  private readonly replay: HTMLDivElement;
  private readonly note: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'ps-hud';
    this.root.setAttribute('role', 'status');
    this.root.setAttribute('aria-live', 'off');

    const title = document.createElement('div');
    title.className = 'ps-title';
    title.textContent = `PHASE SPACE ${__GAME_VERSION__}`;
    this.root.append(title);

    this.row('fps', 'fps');
    this.row('as-ms', 'AS step');
    this.row('tick', 'tick');
    this.row('sim-time', 'sim time');
    this.row('hash', 'hash');
    this.row('backend', 'backend');
    this.row('time-scale', 'time scale');

    this.badge = document.createElement('span');
    this.badge.className = 'ps-badge';
    this.badge.textContent = 'running below real time';
    this.badge.hidden = true;
    this.root.append(this.badge);

    this.replay = document.createElement('div');
    this.replay.className = 'ps-replay';
    this.replay.dataset['state'] = 'idle';
    this.replay.textContent = 'press R to replay';
    this.root.append(this.replay);

    this.note = document.createElement('div');
    this.note.className = 'ps-note';
    this.root.append(this.note);

    const help = document.createElement('div');
    help.className = 'ps-help';
    help.textContent = HELP;
    this.root.append(help);

    parent.append(this.root);
  }

  update(d: HudData): void {
    this.set('fps', d.fps.toFixed(0));
    this.set('as-ms', `${d.asMs.toFixed(2)} ms`);
    this.set('tick', String(d.tick));
    this.set('sim-time', `${d.simTime.toFixed(2)} s`);
    this.set('hash', d.hash === '' ? '-' : d.hash);
    this.set('backend', d.backend);
    this.set('time-scale', d.paused ? `${formatScale(d.timeScale)} (paused)` : formatScale(d.timeScale));
    this.badge.hidden = !d.belowRealTime;
  }

  setReplayStatus(text: string, state: ReplayState): void {
    this.replay.textContent = text;
    this.replay.dataset['state'] = state;
  }

  /** A short note under the status lines (reduced motion, device loss). Empty string clears it. */
  setNote(text: string): void {
    this.note.textContent = text;
  }

  private row(key: string, label: string): void {
    const row = document.createElement('div');
    row.className = 'ps-row';
    const k = document.createElement('span');
    k.className = 'ps-k';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'ps-v';
    v.dataset['k'] = key;
    v.textContent = '-';
    row.append(k, v);
    this.root.append(row);
    this.values.set(key, v);
  }

  private set(key: string, text: string): void {
    const el = this.values.get(key);
    if (el !== undefined && el.textContent !== text) el.textContent = text;
  }
}

function formatScale(x: number): string {
  if (x >= 1) return `${Number.isInteger(x) ? x : x.toFixed(2)}x`;
  return `1/${(1 / x).toFixed(0)}x`;
}
