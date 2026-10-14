import assert from 'node:assert/strict'

import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZDefaultInstantiationRematchMatcher } from '../../src/engines/cognitive/az/core/production/AZDefaultInstantiationRematchMatcher'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZInstantiatedCondition } from '../../src/engines/cognitive/az/core/production/AZInstantiatedCondition'
import type { AZInstantiatedConditionBuilder } from '../../src/engines/cognitive/az/core/production/AZInstantiatedConditionBuilder'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import type { AZProductionNode } from '../../src/engines/cognitive/az/core/production/AZProductionNode'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbol = (id: string): AZSymbol => ({
  id,
  hashId: 1,
  type: 'IDENTIFIER',
  value: id,
})

const wme = (timetag: number): AZWorkingMemoryElement => ({
  timetag,
  identifier: symbol(`I${timetag}`),
  attribute: symbol(`A${timetag}`),
  value: symbol(`V${timetag}`),
  acceptable: false,
})

const positiveCondition: AZProductionCondition = {
  type: 'POSITIVE',
  identifierTest: {
    type: 'EQUALITY',
    referent: symbol('id-test'),
  },
  attributeTest: {
    type: 'EQUALITY',
    referent: symbol('attr-test'),
  },
  valueTest: {
    type: 'EQUALITY',
    referent: symbol('value-test'),
  },
  acceptable: false,
}

const production = (name: string): AZProduction => ({
  name,
  declaredSupport: 'UNDECLARED',
  conditions: [positiveCondition],
  actions: [],
  instantiations: [],
  productionNode: null,
})

const makeNode = (
  p: AZProduction,
): AZProductionNode => ({
  type: 'PRODUCTION',
  nodeId: 1,
  parent: null,
  children: [],
  production: p,
  tokens: [],
})

const makeInstantiation = (
  p: AZProduction,
  conditions: readonly AZInstantiatedCondition[],
): AZInstantiation => ({
  id: 1,
  production: p,
  instantiatedConditions: conditions,
  matchGoal: null,
  matchGoalLevel: 0,
  inMatchSet: false,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
})

const firstWme = wme(1)
const secondWme = wme(2)

const previousConditions: readonly AZInstantiatedCondition[] = [
  {
    type: 'POSITIVE',
    sourceCondition: positiveCondition,
    workingMemoryElement: firstWme,
  },
]

let candidateConditions: readonly AZInstantiatedCondition[] =
  previousConditions

let buildCount = 0

const builder: AZInstantiatedConditionBuilder = {
  build(
    _production: AZProduction,
    _productionNode: AZProductionNode,
    _token: AZToken | null,
    _workingMemoryElement: AZWorkingMemoryElement | null,
  ): readonly AZInstantiatedCondition[] {
    buildCount += 1
    return candidateConditions
  },
}

const matcher =
  new AZDefaultInstantiationRematchMatcher(builder)

const originalProduction = production('p1')
const otherProduction = production('p2')

assert.equal(
  matcher.matches(
    makeInstantiation(
      originalProduction,
      previousConditions,
    ),
    makeNode(otherProduction),
    null,
    null,
  ),
  false,
)

assert.equal(
  buildCount,
  0,
  'production identity mismatch must short-circuit reconstruction',
)

assert.equal(
  matcher.matches(
    makeInstantiation(
      originalProduction,
      previousConditions,
    ),
    makeNode(originalProduction),
    null,
    null,
  ),
  true,
)

candidateConditions = [
  {
    type: 'POSITIVE',
    sourceCondition: positiveCondition,
    workingMemoryElement: secondWme,
  },
]

assert.equal(
  matcher.matches(
    makeInstantiation(
      originalProduction,
      previousConditions,
    ),
    makeNode(originalProduction),
    null,
    null,
  ),
  false,
)

console.log(
  'AZ core instantiation rematch behavior: OK',
)
