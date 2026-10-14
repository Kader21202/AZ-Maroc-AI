import assert from 'node:assert/strict'

import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZQStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZQStructuralStateExtractor'
import { DefaultQStructuralStateCanonicalizer } from '../../src/engines/cognitive/az/monitoring/DefaultQStructuralStateCanonicalizer'

const symbols = new AZSymbolManager()
const workingMemory = new AZWorkingMemory()
const preferenceMemory = new AZPreferenceMemory()
const matchSet = new AZMatchSet()

const identifier =
  symbols.makeIdentifier('N')

const firstAttribute =
  symbols.makeStringConstant('first')

const secondAttribute =
  symbols.makeStringConstant('second')

const makeInstantiation = (
  id: number,
): AZInstantiation => ({
  id,
  production: null,
  instantiatedConditions: [],
  matchGoal: null,
  matchGoalLevel: 1,
  inMatchSet: false,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
})

const makePreference = (
  attribute: typeof firstAttribute,
  value: string,
  id: number,
): AZPreference => ({
  type: 'ACCEPTABLE',
  identifier,
  attribute,
  value: symbols.makeStringConstant(value),
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation: makeInstantiation(id),
})

preferenceMemory.add(
  makePreference(
    firstAttribute,
    'first-value',
    1,
  ),
)

preferenceMemory.add(
  makePreference(
    secondAttribute,
    'second-value',
    2,
  ),
)

const observation =
  new AZQStructuralStateExtractor().extract(
    workingMemory,
    preferenceMemory,
    matchSet,
  )

assert.equal(
  observation.changedSlots.length,
  2,
)

assert.equal(
  observation.preferenceSlots.length,
  2,
)

const canonicalizer =
  new DefaultQStructuralStateCanonicalizer()

const original =
  canonicalizer.canonicalize(observation)

const reversedChangedSlots = {
  ...observation,
  changedSlots:
    [...observation.changedSlots].reverse(),
}

assert.notEqual(
  canonicalizer.canonicalize(
    reversedChangedSlots,
  ),
  original,
  'changedSlots order is causal and must affect Q equivalence',
)

const reversedPreferenceSlots = {
  ...observation,
  preferenceSlots:
    [...observation.preferenceSlots].reverse(),
}

assert.equal(
  canonicalizer.canonicalize(
    reversedPreferenceSlots,
  ),
  original,
  'preferenceSlots enumeration order is structural and must not affect Q equivalence',
)

const matchGoal = {
  type: 'IDENTIFIER' as const,
  technicalId: identifier.id,
}

const firstRetraction = {
  productionName: 'first-retraction',
  matchGoal,
  matchGoalLevel: 1,
  conditions: [],
  generatedPreferences: [],
  inMatchSet: true,
}

const secondRetraction = {
  productionName: 'second-retraction',
  matchGoal,
  matchGoalLevel: 1,
  conditions: [],
  generatedPreferences: [],
  inMatchSet: true,
}

const firstAssertion = {
  type: 'O_ASSERTION' as const,
  productionName: 'first-assertion',
  matchGoal,
  matchGoalLevel: 1,
  conditions: [],
  terminalWme: null,
}

const secondAssertion = {
  type: 'O_ASSERTION' as const,
  productionName: 'second-assertion',
  matchGoal,
  matchGoalLevel: 1,
  conditions: [],
  terminalWme: null,
}

const orderedMatchSetObservation = {
  ...observation,
  matchSet: {
    assertions: [
      secondAssertion,
      firstAssertion,
    ],
    retractions: [
      secondRetraction,
      firstRetraction,
    ],
    nilGoalRetractions: [
      secondRetraction,
      firstRetraction,
    ],
  },
}

const orderedMatchSetCanonical =
  canonicalizer.canonicalize(
    orderedMatchSetObservation,
  )

for (
  const collection of [
    'assertions',
    'retractions',
    'nilGoalRetractions',
  ] as const
) {
  const reversed = {
    ...orderedMatchSetObservation,
    matchSet: {
      ...orderedMatchSetObservation.matchSet,
      [collection]:
        [
          ...orderedMatchSetObservation
            .matchSet[collection],
        ].reverse(),
    },
  }

  assert.notEqual(
    canonicalizer.canonicalize(reversed),
    orderedMatchSetCanonical,
    `${collection} order is causal and must affect Q equivalence`,
  )
}
console.log(
  'AZ Q canonical order semantics: OK',
)
