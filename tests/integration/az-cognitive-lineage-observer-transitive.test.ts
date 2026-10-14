import assert from 'node:assert/strict'

import { AZWmeCausalProvenanceRegistry } from '../../src/engines/cognitive/az/core/AZWmeCausalProvenanceRegistry'

import { AZContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceWmeRegistry'
import { AZImpasseItemBacktraceRegistry } from '../../src/engines/cognitive/az/core/decision/AZImpasseItemBacktraceRegistry'
import { AZNonContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceWmeRegistry'
import { AZAcceptablePreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeRegistry'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiatedCondition } from '../../src/engines/cognitive/az/core/production/AZInstantiatedCondition'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZCognitiveLineageObserver } from '../../src/engines/cognitive/az/monitoring/AZCognitiveLineageObserver'
import type { CognitiveLineageObservation } from '../../src/engines/cognitive/az/monitoring/CognitiveLineageObservation'
import type { CognitiveLineageObservationHandler } from '../../src/engines/cognitive/az/monitoring/CognitiveLineageObservationHandler'

class RecordingHandler
  implements CognitiveLineageObservationHandler
{
  public readonly observations:
    CognitiveLineageObservation[] = []

  public handle(
    observation: CognitiveLineageObservation,
  ): void {
    this.observations.push(observation)
  }
}

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const contextRegistry =
  new AZContextPreferenceWmeRegistry()

const causalProvenanceRegistry =
  new AZWmeCausalProvenanceRegistry()

const nonContextRegistry =
  new AZNonContextPreferenceWmeRegistry(
    causalProvenanceRegistry,
  )

const acceptableRegistry =
  new AZAcceptablePreferenceWmeRegistry()

const impasseRegistry =
  new AZImpasseItemBacktraceRegistry()

const handler =
  new RecordingHandler()

const observer =
  new AZCognitiveLineageObserver(
    causalProvenanceRegistry,
    handler,
  )

const identifier =
  symbols.makeIdentifier('S')

const stageAttribute =
  symbols.makeStringConstant('stage')

const analyzedValue =
  symbols.makeStringConstant('analyzed')

const verificationAttribute =
  symbols.makeStringConstant('verification')

const verifiedValue =
  symbols.makeStringConstant('verified')

function makePositiveSourceCondition(
  attribute: typeof stageAttribute,
  value: typeof analyzedValue,
): Extract<
  AZProductionCondition,
  { readonly type: 'POSITIVE' }
> {
  return {
    type: 'POSITIVE',
    identifierTest: {
      type: 'EQUALITY',
      referent: identifier,
    },
    attributeTest: {
      type: 'EQUALITY',
      referent: attribute,
    },
    valueTest: {
      type: 'EQUALITY',
      referent: value,
    },
    acceptable: false,
  }
}

/*
 * A produces stage=analyzed.
 */
const productionA: AZProduction = {
  name: 'az-lineage-A',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const instantiationA: AZInstantiation = {
  id: 1,
  production: productionA,
  instantiatedConditions: [],
  matchGoal: identifier,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const preferenceA: AZPreference = {
  type: 'ACCEPTABLE',
  identifier,
  attribute: stageAttribute,
  value: analyzedValue,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation: instantiationA,
}

instantiationA.generatedPreferences.push(
  preferenceA,
)

const stageWme =
  workingMemory.createElement(
    identifier,
    stageAttribute,
    analyzedValue,
    false,
  )

nonContextRegistry.set(
  stageWme,
  preferenceA,
)

/*
 * B consumes stage=analyzed and produces
 * verification=verified.
 */
const sourceConditionB =
  makePositiveSourceCondition(
    stageAttribute,
    analyzedValue,
  )

const conditionB:
  AZInstantiatedCondition = {
    type: 'POSITIVE',
    sourceCondition:
      sourceConditionB,
    workingMemoryElement:
      stageWme,
  }

const productionB: AZProduction = {
  name: 'az-lineage-B',
  declaredSupport: 'UNDECLARED',
  conditions: [
    sourceConditionB,
  ],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const instantiationB: AZInstantiation = {
  id: 2,
  production: productionB,
  instantiatedConditions: [
    conditionB,
  ],
  matchGoal: identifier,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const preferenceB: AZPreference = {
  type: 'ACCEPTABLE',
  identifier,
  attribute:
    verificationAttribute,
  value:
    verifiedValue,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation:
    instantiationB,
}

instantiationB.generatedPreferences.push(
  preferenceB,
)

const verificationWme =
  workingMemory.createElement(
    identifier,
    verificationAttribute,
    verifiedValue,
    false,
  )

nonContextRegistry.set(
  verificationWme,
  preferenceB,
)

/*
 * C consumes verification=verified.
 */
const sourceConditionC =
  makePositiveSourceCondition(
    verificationAttribute,
    verifiedValue,
  )

const conditionC:
  AZInstantiatedCondition = {
    type: 'POSITIVE',
    sourceCondition:
      sourceConditionC,
    workingMemoryElement:
      verificationWme,
  }

const productionC: AZProduction = {
  name: 'az-lineage-C',
  declaredSupport: 'UNDECLARED',
  conditions: [
    sourceConditionC,
  ],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const instantiationC: AZInstantiation = {
  id: 3,
  production: productionC,
  instantiatedConditions: [
    conditionC,
  ],
  matchGoal: identifier,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

observer.observe([
  instantiationC,
])

assert.equal(
  handler.observations.length,
  1,
)

const observation =
  handler.observations[0]

assert.ok(observation)

assert.equal(
  observation.productionName,
  'az-lineage-C',
)

assert.equal(
  observation.premises.length,
  1,
)

const premise =
  observation.premises[0]

assert.ok(premise)

assert.equal(
  premise.attribute,
  'verification',
)

assert.equal(
  premise.value,
  'verified',
)

assert.equal(
  premise.producerProductionName,
  'az-lineage-B',
)

assert.deepEqual(
  premise.producerProductionChain,
  [
    'az-lineage-B',
    'az-lineage-A',
  ],
)

assert.equal(
  premise.causalDepth,
  2,
)

console.log(
  'AZ cognitive lineage observer transitive: OK',
)
