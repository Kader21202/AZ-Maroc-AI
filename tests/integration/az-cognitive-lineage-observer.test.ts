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

const attribute =
  symbols.makeStringConstant('stage')

const value =
  symbols.makeStringConstant('analyzed')

const producerProduction: AZProduction = {
  name: 'az-lineage-producer',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const producerInstantiation: AZInstantiation = {
  id: 1,
  production: producerProduction,
  instantiatedConditions: [],
  matchGoal: identifier,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const producerPreference: AZPreference = {
  type: 'ACCEPTABLE',
  identifier,
  attribute,
  value,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: false,
  slot: null,
  instantiation:
    producerInstantiation,
}

producerInstantiation
  .generatedPreferences
  .push(producerPreference)

const producedWme =
  workingMemory.createElement(
    identifier,
    attribute,
    value,
    false,
  )

nonContextRegistry.set(
  producedWme,
  producerPreference,
)

const equalityTest = {
  type: 'EQUALITY' as const,
  referent: identifier,
}

const sourceCondition: Extract<
  AZProductionCondition,
  { readonly type: 'POSITIVE' }
> = {
  type: 'POSITIVE',
  identifierTest: equalityTest,
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

const consumedCondition:
  AZInstantiatedCondition = {
    type: 'POSITIVE',
    sourceCondition,
    workingMemoryElement:
      producedWme,
  }

const consumerProduction: AZProduction = {
  name: 'az-lineage-consumer',
  declaredSupport: 'UNDECLARED',
  conditions: [
    sourceCondition,
  ],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const consumerInstantiation: AZInstantiation = {
  id: 2,
  production: consumerProduction,
  instantiatedConditions: [
    consumedCondition,
  ],
  matchGoal: identifier,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

observer.observe([
  consumerInstantiation,
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
  'az-lineage-consumer',
)

assert.equal(
  observation.premises.length,
  1,
)

const premise =
  observation.premises[0]

assert.ok(premise)

assert.equal(
  premise.timetag,
  producedWme.timetag,
)

assert.equal(
  premise.attribute,
  'stage',
)

assert.equal(
  premise.value,
  'analyzed',
)

assert.equal(
  premise.producerProductionName,
  'az-lineage-producer',
)

assert.deepEqual(
  premise.producerProductionChain,
  [
    'az-lineage-producer',
  ],
)

assert.equal(
  premise.causalDepth,
  1,
)

console.log(
  'AZ cognitive lineage observer: OK',
)
