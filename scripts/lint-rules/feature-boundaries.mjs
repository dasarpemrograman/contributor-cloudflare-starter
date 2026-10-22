import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const features = fileURLToPath(new URL('../../src/features/', import.meta.url));

function owner(file) {
  const path = relative(features, file);
  return path.startsWith('..') || path === '' ? undefined : path.split(sep)[0];
}

export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      crossFeature:
        'Feature {{from}} imports internals from {{to}}. Compose capabilities in src/app.ts.',
    },
  },
  create(context) {
    const file = context.filename;
    const from = owner(file);
    function check(node, source) {
      if (
        !from ||
        typeof source?.value !== 'string' ||
        !source.value.startsWith('.')
      )
        return;
      const to = owner(resolve(dirname(file), source.value));
      if (to && to !== from)
        context.report({ node, messageId: 'crossFeature', data: { from, to } });
    }
    return {
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source),
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'require')
          check(node, node.arguments[0]);
      },
    };
  },
};
