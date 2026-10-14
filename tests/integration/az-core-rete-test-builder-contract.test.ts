import assert from 'node:assert/strict'

import type {
  AZReteTestBuildResult,
  AZReteTestBuilder,
} from '../../src/engines/cognitive/az/core/production/AZReteTestBuilder'

const builder: AZReteTestBuilder = {
  buildForTest() {
    const result: AZReteTestBuildResult = {
      tests: [],
      alphaConstant: null,
    }

    return result
  },
}

const result = builder.buildForTest(
  {
    type: 'GOAL_ID',
  },
  0,
  0,
  [],
  null,
)

assert.deepEqual(result.tests, [])
assert.equal(result.alphaConstant, null)

console.log('AZ core rete test builder contract: OK')
