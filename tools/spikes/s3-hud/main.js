// Spike S3 (P00 WP0.2): React 19 with Zustand against Preact signals, updating
// 200 readouts at 20 Hz. The runner (tools/spikes/s3-hud.ts) measures the main
// thread through the DevTools protocol (TaskDuration, ScriptDuration,
// LayoutDuration, RecalcStyleDuration deltas) while each variant runs.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import { h, render } from 'preact';
import { signal } from '@preact/signals';

const N = 200;
const HZ = 20;

function fmt(v) {
  return v.toFixed(3);
}

// React + Zustand
const useStore = create(() => ({ values: new Array(N).fill(0) }));
function ReactReadout({ i }) {
  const v = useStore((s) => s.values[i]);
  return React.createElement('span', null, `r${i} ${fmt(v)} m/s`);
}
function ReactHud() {
  return React.createElement('div', { className: 'grid' }, Array.from({ length: N }, (_, i) => React.createElement(ReactReadout, { key: i, i })));
}

// Preact signals
const signals = Array.from({ length: N }, () => signal(0));
function PreactReadout({ i }) {
  return h('span', null, `p${i} ${fmt(signals[i].value)} m/s`);
}
function PreactHud() {
  return h('div', { class: 'grid' }, Array.from({ length: N }, (_, i) => h(PreactReadout, { key: i, i })));
}

let tick = 0;
function nextValues() {
  tick++;
  const out = new Array(N);
  for (let i = 0; i < N; i++) out[i] = Math.sin(tick * 0.05 + i) * 10;
  return out;
}

async function runVariant(name, seconds) {
  const reactRoot = document.getElementById('react');
  const preactRoot = document.getElementById('preact');
  reactRoot.replaceChildren();
  preactRoot.replaceChildren();
  let root = null;
  if (name === 'react') {
    root = createRoot(reactRoot);
    root.render(React.createElement(ReactHud));
  } else {
    render(h(PreactHud), preactRoot);
  }
  await new Promise((r) => setTimeout(r, 300));
  const updates = Math.round(seconds * HZ);
  const t0 = performance.now();
  let syncMs = 0;
  for (let u = 0; u < updates; u++) {
    const values = nextValues();
    const s = performance.now();
    if (name === 'react') {
      useStore.setState({ values });
    } else {
      for (let i = 0; i < N; i++) signals[i].value = values[i];
    }
    syncMs += performance.now() - s;
    await new Promise((r) => setTimeout(r, 1000 / HZ));
  }
  const wall = performance.now() - t0;
  await new Promise((r) => setTimeout(r, 200));
  if (root !== null) root.unmount();
  else render(null, preactRoot);
  return { variant: name, readouts: N, hz: HZ, updates, wallMs: wall, syncMsPerUpdate: syncMs / updates };
}

window.__s3 = { runVariant };
