import assert from 'node:assert/strict'
import {
  AZDefaultReteHashExtractor,
} from '../../src/engines/cognitive/az/core/production/AZReteHashExtractor'
import type {
  AZReteTest,
} from '../../src/engines/cognitive/az/core/production/AZReteTest'

const extractor =
  new AZDefaultReteHashExtractor()

const variableHashTest: AZReteTest = {
  rightFieldNumber: 0,
  type: 'VARIABLE_RELATIONAL',
  relationalType: 'EQUAL',
  data: {
    kind: 'VARIABLE',
    location: {
      levelsUp: 2,
      fieldNumber: 1,
    },
  },
  next: null,
}

const constantTest: AZReteTest = {
  rightFieldNumber: 2,
  type: 'CONSTANT_RELATIONAL',
  relationalType: 'EQUAL',
  data: {
    kind: 'NONE',
  },
  next: null,
}


const notEqualVariableTest: AZReteTest = {
  rightFieldNumber: 1,
  type: 'VARIABLE_RELATIONAL',
  relationalType: 'NOT_EQUAL',
  data: {
    kind: 'VARIABLE',
    location: { levelsUp: 1, fieldNumber: 0 },
  },
  next: null,
}

const hashed =
  extractor.extract([
    constantTest,
    variableHashTest,
    notEqualVariableTest,
  ])

assert.equal(hashed.hashed, true)
assert.deepEqual(
  hashed.leftHashLocation,
  {
    levelsUp: 2,
    fieldNumber: 1,
  },
)
assert.deepEqual(
  hashed.remainingTests,
  [constantTest, notEqualVariableTest],
)

const unHashed =
  extractor.extract([
    constantTest,
  ])

assert.equal(unHashed.hashed, false)
assert.deepEqual(
  unHashed.leftHashLocation,
  {
    levelsUp: 0,
    fieldNumber: 0,
  },
)
assert.deepEqual(
  unHashed.remainingTests,
  [constantTest],
)

console.log(
  'AZ RETE hash extraction: OK',
)

