import assert from 'node:assert/strict'

import { AZAlphaMemory } from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import { AZDefaultReteLinkManager } from '../../src/engines/cognitive/az/core/production/AZDefaultReteLinkManager'
import type { AZPositiveNode } from '../../src/engines/cognitive/az/core/production/AZPositiveNode'

const alphaMemory =
  new AZAlphaMemory(
    1,
    null,
    null,
    null,
    false,
  )

const node: AZPositiveNode = {
  type: 'POSITIVE',
  nodeId: 1,
  parent: null,
  children: [],
  alphaMemory,
  tests: [],
  leftUnlinked: false,
  rightUnlinked: true,
}

const manager =
  new AZDefaultReteLinkManager()

assert.equal(
  manager.isRightUnlinked(node),
  true,
)

manager.linkRight(node)

assert.equal(
  manager.isRightUnlinked(node),
  false,
)

assert.equal(
  alphaMemory.getBetaNodes().includes(node),
  true,
)

manager.unlinkRight(node)

assert.equal(
  manager.isRightUnlinked(node),
  true,
)

assert.equal(
  alphaMemory.getBetaNodes().includes(node),
  false,
)

assert.equal(
  manager.isPositiveLeftUnlinked(node),
  false,
)

manager.unlinkPositiveLeft(node)

assert.equal(
  manager.isPositiveLeftUnlinked(node),
  true,
)

manager.linkPositiveLeft(node)

assert.equal(
  manager.isPositiveLeftUnlinked(node),
  false,
)

console.log(
  'AZ core RETE link manager: OK',
)
