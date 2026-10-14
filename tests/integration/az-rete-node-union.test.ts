import type { AZReteNode } from '../../src/engines/cognitive/az/core/production/AZReteNode'

function readNode(node: AZReteNode): string {
  switch (node.type) {
    case 'PRODUCTION':
      return node.production.name

    case 'MEMORY':
    case 'UNHASHED_MEMORY':
      return String(node.tokens.length)

    case 'POSITIVE':
    case 'UNHASHED_POSITIVE':
      return String(node.tests.length)

    case 'NEGATIVE':
    case 'UNHASHED_NEGATIVE':
      return String(node.tokens.length)

    case 'MP':
    case 'UNHASHED_MP':
      return String(node.tokens.length)

    case 'CN':
    case 'CN_PARTNER':
      return String(node.tokens.length)

    case 'DUMMY_TOP':
      return String(node.tokens.length)

    case 'DUMMY_MATCHES':
      return node.type
  }
}

void readNode
