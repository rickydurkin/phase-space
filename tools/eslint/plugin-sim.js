// ESLint rules that enforce the determinism contract of src/sim (MASTER 5.4).
// Each rule is proved to fire by tests/unit/lint-rules.test.ts.

export const ALLOWED_MATH = new Set([
  'sqrt', 'abs', 'min', 'max', 'floor', 'ceil', 'round', 'sign', 'fround', 'trunc', 'imul', 'clz32',
  'PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2',
]);

export const ALLOWED_PACKAGES = new Set(['@dimforge/rapier3d-deterministic-compat']);

const BANNED_GLOBALS = new Set([
  'Date', 'performance', 'crypto', 'setTimeout', 'setInterval', 'requestAnimationFrame',
  'requestIdleCallback', 'queueMicrotask', 'window', 'document', 'navigator', 'localStorage',
  'indexedDB', 'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker',
]);

function memberName(node) {
  if (!node.computed) return node.property.type === 'Identifier' ? node.property.name : null;
  if (node.property.type === 'Literal') return String(node.property.value);
  return null;
}

const noNondeterministicMath = {
  meta: {
    type: 'problem',
    docs: { description: 'Only the allowlisted Math members may be used in src/sim; the rest differ between engines.' },
    schema: [],
    messages: {
      banned: 'Math.{{name}} is not deterministic across JavaScript engines. Use src/sim/dmath (MASTER 5.4).',
      computed: 'Computed access to Math is not allowed in src/sim; name the allowlisted member directly.',
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (node.object.type !== 'Identifier' || node.object.name !== 'Math') return;
        const name = memberName(node);
        if (name === null) {
          context.report({ node, messageId: 'computed' });
          return;
        }
        if (!ALLOWED_MATH.has(name)) context.report({ node, messageId: 'banned', data: { name } });
      },
    };
  },
};

const noWallClock = {
  meta: {
    type: 'problem',
    docs: { description: 'No wall clock, randomness source, timers or host globals in src/sim.' },
    schema: [],
    messages: {
      banned: '{{name}} is not allowed in src/sim: the simulation may not read the wall clock, timers or host globals (MASTER 5.4).',
    },
  },
  create(context) {
    return {
      'Program:exit'(node) {
        const scope = context.sourceCode.getScope(node);
        const seen = new Set();
        const report = (identifier) => {
          if (seen.has(identifier)) return;
          seen.add(identifier);
          context.report({ node: identifier, messageId: 'banned', data: { name: identifier.name } });
        };
        // Unresolved references (plain globals) ...
        for (const ref of scope.through) if (BANNED_GLOBALS.has(ref.identifier.name)) report(ref.identifier);
        // ... and references to globals the TypeScript lib declares (Date, performance, window ...),
        // which the typescript-eslint scope manager resolves instead of leaving in 'through'.
        for (const name of BANNED_GLOBALS) {
          const variable = scope.set.get(name);
          if (variable === undefined || variable.defs.length > 0) continue; // user-defined shadow: allowed
          for (const ref of variable.references) report(ref.identifier);
        }
      },
    };
  },
};

const noExponentOperator = {
  meta: {
    type: 'problem',
    docs: { description: 'The ** operator is implementation-approximated like Math.pow; use dmath.pow.' },
    schema: [],
    messages: { banned: 'The ** operator is not deterministic across engines. Use dmath.pow (MASTER 5.4).' },
  },
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator === '**') context.report({ node, messageId: 'banned' });
      },
      AssignmentExpression(node) {
        if (node.operator === '**=') context.report({ node, messageId: 'banned' });
      },
    };
  },
};

function checkSource(context, node, source) {
  if (source === null || source === undefined) return;
  const value = source.value;
  if (typeof value !== 'string') return;
  if (value.startsWith('./') || value.startsWith('../')) return;
  if (ALLOWED_PACKAGES.has(value)) return;
  context.report({ node, messageId: 'banned', data: { name: value } });
}

const importAllowlist = {
  meta: {
    type: 'problem',
    docs: { description: 'src/sim may import only relative modules and the pinned Rapier deterministic build.' },
    schema: [],
    messages: {
      banned: "Import of '{{name}}' is not allowed in src/sim. Only relative modules and the allowlisted packages (Rapier deterministic) may be imported; adding one needs an ADR with a determinism test (MASTER 5.4).",
      dynamic: 'Dynamic import is not allowed in src/sim.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        checkSource(context, node, node.source);
      },
      ExportAllDeclaration(node) {
        checkSource(context, node, node.source);
      },
      ExportNamedDeclaration(node) {
        checkSource(context, node, node.source);
      },
      ImportExpression(node) {
        context.report({ node, messageId: 'dynamic' });
      },
    };
  },
};

const plugin = {
  meta: { name: 'eslint-plugin-sim', version: '0.1.0' },
  rules: {
    'no-nondeterministic-math': noNondeterministicMath,
    'no-wall-clock': noWallClock,
    'no-exponent-operator': noExponentOperator,
    'import-allowlist': importAllowlist,
  },
};

export default plugin;
