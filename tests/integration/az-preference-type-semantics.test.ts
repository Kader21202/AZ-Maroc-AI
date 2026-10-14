import assert from 'node:assert/strict'

import { isAZBinaryPreferenceType } from '../../src/engines/cognitive/az/core/operator/AZPreferenceTypeSemantics'

for (const type of [
  'BINARY_INDIFFERENT',
  'BINARY_PARALLEL',
  'BETTER',
  'WORSE',
  'NUMERIC_INDIFFERENT',
] as const) {
  assert.equal(
    isAZBinaryPreferenceType(type),
    true,
    `${type} must be a binary preference type`,
  )
}

for (const type of [
  'ACCEPTABLE',
  'REQUIRE',
  'UNARY_INDIFFERENT',
] as const) {
  assert.equal(
    isAZBinaryPreferenceType(type),
    false,
    `${type} must not be a binary preference type`,
  )
}

console.log(
  'AZ binary preference type semantics: OK',
)
