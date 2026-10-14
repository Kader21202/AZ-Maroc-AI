import assert from 'node:assert/strict'

import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import type { AZVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZVariableBindingManager'

const manager: AZVariableBindingManager =
  new AZDefaultVariableBindingManager()

assert.equal(
  manager instanceof AZDefaultVariableBindingManager,
  true,
)

console.log(
  'AZ core variable binding contract: OK',
)
