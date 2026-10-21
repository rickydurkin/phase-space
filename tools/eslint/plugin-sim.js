// ESLint rules that enforce the determinism contract of src/sim (MASTER 5.4).
// Each rule is proved to fire by tests/unit/lint-rules.test.ts.

export const ALLOWED_MATH = new Set([
  'sqrt', 'abs', 'min', 'max', 'floor', 'ceil', 'round', 'sign', 'fround', 'trunc', 'imul', 'clz32',
  'PI', 'E', 'LN2', 'LN10', 'LOG2E', 'LOG10E', 'SQRT2', 'SQRT1_2',
]);

export const ALLOWED_PACKAGES = new Set(['@dimforge/rapier3d-deterministic-compat']);

const BANNED_GLOBALS = new Set([
  // wall clock, timers and host access
  'Date', 'performance', 'crypto', 'setTimeout', 'setInterval', 'requestAnimationFrame',
  'requestIdleCallback', 'queueMicrotask', 'window', 'document', 'navigator', 'localStorage',
  'indexedDB', 'fetch', 'XMLHttpRequest', 'WebSocket', 'Worker', 'process', 'require',
  // routes around the other rules: the global object and reflection (D-004)
  'globalThis', 'self', 'global', 'frames', 'Reflect', 'eval', 'Function', 'Proxy',
  // results that depend on the garbage collector, the locale or other threads
  'WeakRef', 'FinalizationRegistry', 'Intl', 'Atomics', 'SharedArrayBuffer',
]);

/**
 * Value references to a global variable in the module's global scope: unresolved
 * references (scope.through) and references to globals the TypeScript lib declares,
 * which the typescript-eslint scope manager resolves instead. A user-defined
 * variable of the same name (a shadow) is not a global and is left alone.
 */
function globalValueReferences(scope, name) {
  const out = [];
  for (const ref of scope.through) {
    if (ref.identifier.name === name && !isTypeOnly(ref)) out.push(ref);
  }
  const variable = scope.set.get(name);
  if (variable !== undefined && variable.defs.length === 0) {
    for (const ref of variable.references) if (!isTypeOnly(ref)) out.push(ref);
  }
  return out;
}

function isTypeOnly(ref) {
  return ref.isTypeReference === true && ref.isValueReference !== true;
}

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
      alias: 'Math may only be used as Math.<allowlisted member> in src/sim; aliasing, destructuring or passing Math hides banned calls from this rule (D-004).',
    },
  },
  create(context) {
    return {
      // Any use of Math that is not a direct member access: const M = Math, const { sin } = Math,
      // Reflect.get(Math, ...), f(Math) and so on.
      'Program:exit'(node) {
        const scope = context.sourceCode.getScope(node);
        for (const ref of globalValueReferences(scope, 'Math')) {
          const id = ref.identifier;
          const parent = id.parent;
          if (parent && parent.type === 'MemberExpression' && parent.object === id) continue;
          context.report({ node: id, messageId: 'alias' });
        }
      },
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
      banned: '{{name}} is not allowed in src/sim: the simulation may not use the wall clock, timers, host globals, reflection or the global object (MASTER 5.4, D-004).',
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
        for (const name of BANNED_GLOBALS) {
          for (const ref of globalValueReferences(scope, name)) report(ref.identifier);
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
