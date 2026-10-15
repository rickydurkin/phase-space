// Error overlay (WP0.5): every uncaught error, unhandled rejection, worker
// error and console.error call is recorded and shown full screen with a
// copyable report. Nothing is swallowed: the browser still logs uncaught
// errors itself, and console.error is passed through to the original.

export interface ErrorContext {
  backend(): string;
  tick(): number;
  hash(): string;
}

export interface ErrorOverlay {
  /** Every recorded error message, oldest first (console.error calls included). */
  errors(): string[];
  /** Register the worker so its 'error' and 'messageerror' events reach the overlay. */
  attachWorker(worker: Worker): void;
  /** Provide live values for the report. */
  setContext(ctx: Partial<ErrorContext>): void;
  /** Record and show an error from application code (also logs it to the console). */
  report(error: unknown, source: string): void;
}

interface ErrorEntry {
  readonly source: string;
  readonly message: string;
  readonly stack: string;
  readonly time: string;
}

const STYLE = `
.ps-error-overlay{position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;gap:12px;
  padding:24px;box-sizing:border-box;overflow:auto;background:rgba(20,10,10,0.94);color:#f3e9e7;
  font:13px/1.5 ui-monospace,Menlo,Consolas,monospace}
.ps-error-overlay h1{margin:0;font-size:16px;color:#ff8a76}
.ps-error-overlay .ps-error-actions{display:flex;gap:8px}
.ps-error-overlay button{padding:6px 12px;border:1px solid #ff8a76;border-radius:4px;background:transparent;
  color:#ffd5cc;font:inherit;cursor:pointer}
.ps-error-overlay button:hover{background:rgba(255,138,118,0.15)}
.ps-error-overlay .ps-error-entry{padding:10px 12px;border-left:3px solid #ff8a76;background:rgba(0,0,0,0.35)}
.ps-error-overlay .ps-error-source{color:#c9a59c}
.ps-error-overlay pre{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;color:#e7d3cd}
.ps-error-overlay textarea{width:100%;min-height:160px;background:#140c0c;color:#f3e9e7;border:1px solid #6b3d36;
  font:inherit}
`;

function describe(error: unknown): { message: string; stack: string } {
  if (error instanceof Error) {
    return { message: `${error.name}: ${error.message}`, stack: error.stack ?? '' };
  }
  if (typeof error === 'string') return { message: error, stack: '' };
  try {
    return { message: JSON.stringify(error), stack: '' };
  } catch {
    return { message: String(error), stack: '' };
  }
}

function formatArgs(args: unknown[]): { message: string; stack: string } {
  const parts: string[] = [];
  let stack = '';
  for (const a of args) {
    const d = describe(a);
    parts.push(d.message);
    if (stack === '' && d.stack !== '') stack = d.stack;
  }
  return { message: parts.join(' '), stack };
}

export function installErrorOverlay(): ErrorOverlay {
  const entries: ErrorEntry[] = [];
  let context: Partial<ErrorContext> = {};
  let overlay: HTMLDivElement | null = null;
  let list: HTMLDivElement | null = null;
  let countEl: HTMLSpanElement | null = null;
  let reportArea: HTMLTextAreaElement | null = null;

  const buildReport = (): string => {
    const lines = [
      `PHASE SPACE ${__GAME_VERSION__} error report`,
      `time: ${new Date().toISOString()}`,
      `page: ${location.href}`,
      `user agent: ${navigator.userAgent}`,
      `backend: ${safe(() => context.backend?.() ?? 'unknown')}`,
      `tick: ${safe(() => String(context.tick?.() ?? 'unknown'))}`,
      `hash: ${safe(() => context.hash?.() ?? 'unknown')}`,
      `errors: ${entries.length}`,
      '',
    ];
    entries.forEach((e, i) => {
      lines.push(`[${i + 1}] ${e.time} ${e.source}`, e.message);
      if (e.stack !== '') lines.push(e.stack);
      lines.push('');
    });
    return lines.join('\n');
  };

  const ensureOverlay = (): void => {
    if (overlay !== null) return;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.append(style);

    overlay = document.createElement('div');
    overlay.className = 'ps-error-overlay';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-label', 'Error report');

    const h1 = document.createElement('h1');
    h1.textContent = 'Something went wrong';
    countEl = document.createElement('span');
    const p = document.createElement('div');
    p.append('The page kept running where it could. ', countEl);

    const actions = document.createElement('div');
    actions.className = 'ps-error-actions';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.textContent = 'Copy report';
    copy.addEventListener('click', () => {
      void copyReport(copy);
    });
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', () => {
      overlay?.remove();
      overlay = null;
      list = null;
      countEl = null;
      reportArea = null;
    });
    actions.append(copy, dismiss);

    list = document.createElement('div');
    overlay.append(h1, p, actions, list);
    document.body.append(overlay);
  };

  const copyReport = async (button: HTMLButtonElement): Promise<void> => {
    const text = buildReport();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
      setTimeout(() => {
        button.textContent = 'Copy report';
      }, 1500);
    } catch {
      // Clipboard access can be refused; show the report for manual copying instead.
      if (reportArea === null && overlay !== null) {
        reportArea = document.createElement('textarea');
        reportArea.readOnly = true;
        overlay.append(reportArea);
      }
      if (reportArea !== null) {
        reportArea.value = text;
        reportArea.focus();
        reportArea.select();
      }
      button.textContent = 'Select and copy below';
    }
  };

  const record = (source: string, message: string, stack: string): void => {
    const entry: ErrorEntry = { source, message, stack, time: new Date().toISOString() };
    entries.push(entry);
    if (document.body === null) {
      document.addEventListener('DOMContentLoaded', () => render(entry), { once: true });
      return;
    }
    render(entry);
  };

  const render = (entry: ErrorEntry): void => {
    ensureOverlay();
    if (list === null || countEl === null) return;
    countEl.textContent = `${entries.length} error${entries.length === 1 ? '' : 's'} recorded.`;
    const div = document.createElement('div');
    div.className = 'ps-error-entry';
    const src = document.createElement('div');
    src.className = 'ps-error-source';
    src.textContent = `${entry.time} ${entry.source}`;
    const msg = document.createElement('div');
    msg.textContent = entry.message;
    div.append(src, msg);
    if (entry.stack !== '') {
      const pre = document.createElement('pre');
      pre.textContent = entry.stack;
      div.append(pre);
    }
    list.append(div);
  };

  window.addEventListener('error', (e: ErrorEvent) => {
    const d = e.error === undefined || e.error === null ? { message: e.message, stack: '' } : describe(e.error);
    const where = e.filename !== '' ? ` (${e.filename}:${e.lineno}:${e.colno})` : '';
    record('window.error', d.message + where, d.stack);
  });

  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    const d = describe(e.reason);
    record('unhandledrejection', d.message, d.stack);
  });

  const originalError = console.error.bind(console);
  console.error = (...args: unknown[]): void => {
    const d = formatArgs(args);
    originalError(...args);
    record('console.error', d.message, d.stack);
  };

  return {
    errors: () => entries.map((e) => `${e.source}: ${e.message}`),
    attachWorker(worker: Worker): void {
      worker.addEventListener('error', (e: ErrorEvent) => {
        const where = e.filename !== '' ? ` (${e.filename}:${e.lineno}:${e.colno})` : '';
        record('worker.error', `${e.message}${where}`, '');
      });
      worker.addEventListener('messageerror', (e: MessageEvent) => {
        record('worker.messageerror', `message could not be deserialised: ${describe(e.data).message}`, '');
      });
    },
    setContext(ctx: Partial<ErrorContext>): void {
      context = { ...context, ...ctx };
    },
    report(error: unknown, source: string): void {
      // console.error is hooked above, so this both logs and records.
      console.error(`[${source}]`, error);
    },
  };
}

function safe(fn: () => string): string {
  try {
    return fn();
  } catch (e) {
    return `unavailable (${describe(e).message})`;
  }
}
