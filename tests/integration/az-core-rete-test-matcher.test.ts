import assert from 'node:assert/strict'

import { AZDefaultReteTestMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultReteTestMatcher'
import type { AZReteTest } from '../../src/engines/cognitive/az/core/production/AZReteTest'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

const symbol = (
  id: string,
  value: string | number = id,
  type: AZSymbol['type'] = 'IDENTIFIER',
): AZSymbol => ({
  id,
  hashId: id.charCodeAt(0),
  type,
  value,
})

const leftValue = symbol('L', 5, 'INTEGER_CONSTANT')
const rightValue = symbol('R', 7, 'INTEGER_CONSTANT')

const leftWme: AZWorkingMemoryElement = {
  timetag: 1,
  identifier: symbol('I'),
  attribute: symbol('A'),
  value: leftValue,
  acceptable: false,
}

const rightWme: AZWorkingMemoryElement = {
  timetag: 2,
  identifier: symbol('J'),
  attribute: symbol('B'),
  value: rightValue,
  acceptable: false,
}

const token: AZToken = {
  parent: null,
  workingMemoryElement: leftWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const matcher =
  new AZDefaultReteTestMatcher()

const constantGreater: AZReteTest = {
  rightFieldNumber: 2,
  type: 'CONSTANT_RELATIONAL',
  relationalType: 'GREATER',
  data: {
    kind: 'CONSTANT',
    symbol: leftValue,
  },
  next: null,
}

assert.equal(
  matcher.matches(
    constantGreater,
    token,
    rightWme,
  ),
  true,
)

const variableGreater: AZReteTest = {
  rightFieldNumber: 2,
  type: 'VARIABLE_RELATIONAL',
  relationalType: 'GREATER',
  data: {
    kind: 'VARIABLE',
    location: {
      levelsUp: 1,
      fieldNumber: 2,
    },
  },
  next: null,
}

assert.equal(
  matcher.matches(
    variableGreater,
    token,
    rightWme,
  ),
  true,
)

const constantEqual: AZReteTest = {
  rightFieldNumber: 2,
  type: 'CONSTANT_RELATIONAL',
  relationalType: 'EQUAL',
  data: { kind: 'CONSTANT', symbol: rightValue },
  next: null,
}

assert.equal(matcher.matches(constantEqual, token, rightWme), true)

const ancestorToken: AZToken = {
  parent: null,
  workingMemoryElement: leftWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const childToken: AZToken = {
  parent: ancestorToken,
  workingMemoryElement: rightWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const variableEqualAtAncestor: AZReteTest = {
  rightFieldNumber: 2,
  type: 'VARIABLE_RELATIONAL',
  relationalType: 'EQUAL',
  data: {
    kind: 'VARIABLE',
    location: { levelsUp: 2, fieldNumber: 2 },
  },
  next: null,
}

assert.equal(
  matcher.matches(variableEqualAtAncestor, childToken, rightWme),
  false,
)

const sameType: AZReteTest = {
  rightFieldNumber: 2,
  type: 'CONSTANT_RELATIONAL',
  relationalType: 'SAME_TYPE',
  data: { kind: 'CONSTANT', symbol: leftValue },
  next: null,
}

assert.equal(matcher.matches(sameType, token, rightWme), true)

const stringFive = symbol('S', '5', 'STRING_CONSTANT')
const differentType: AZReteTest = {
  rightFieldNumber: 2,
  type: 'CONSTANT_RELATIONAL',
  relationalType: 'SAME_TYPE',
  data: { kind: 'CONSTANT', symbol: stringFive },
  next: null,
}

assert.equal(matcher.matches(differentType, token, rightWme), false)
const disjunction: AZReteTest = {
  rightFieldNumber: 2,
  type: 'DISJUNCTION',
  data: {
    kind: 'DISJUNCTION',
    symbols: [rightValue],
  },
  next: null,
}

assert.equal(
  matcher.matches(
    disjunction,
    token,
    rightWme,
  ),
  true,
)

assert.equal(
  matcher.matchesAll(
    [
      constantGreater,
      variableGreater,
      disjunction,
    ],
    token,
    rightWme,
  ),
  true,
)

console.log(
  'AZ core RETE test matcher: OK',
)
