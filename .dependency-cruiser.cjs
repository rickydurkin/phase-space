/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'sim-no-presentation',
      comment: 'src/sim may not import DOM, rendering, GPU, UI or app code (MASTER 5.4, 5.9).',
      severity: 'error',
      from: { path: '^src/sim' },
      to: { path: '^src/(app|render|ui|gpu|audio|content)' },
    },
    {
      name: 'sim-no-packages-outside-allowlist',
      comment: 'src/sim may import only the pinned Rapier deterministic build (MASTER 5.4).',
      severity: 'error',
      from: { path: '^src/sim' },
      to: {
        dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled', 'npm-no-pkg', 'npm-unknown'],
        pathNot: ['^node_modules/@dimforge/rapier3d-deterministic-compat/'],
      },
    },
    {
      name: 'sim-no-node-builtins',
      comment: 'src/sim runs identically in browsers and Node; no Node built-ins.',
      severity: 'error',
      from: { path: '^src/sim' },
      to: { dependencyTypes: ['core'] },
    },
    {
      name: 'gpu-kernels-no-renderer',
      comment: 'src/gpu kernels and CPU references stay independent of three.js.',
      severity: 'error',
      from: { path: '^src/gpu' },
      to: { path: '^node_modules/three/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'module', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.mjs', '.cjs'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
