import assert from 'node:assert/strict'

import { AZWmeCausalProvenanceRegistry } from '../../src/engines/cognitive/az/core/AZWmeCausalProvenanceRegistry'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZInstantiatedCondition } from '../../src/engines/cognitive/az/core/production/AZInstantiatedCondition'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProductionCondition } from '../../src/engines/cognitive/az/core/production/AZProductionCondition'
import { AZSubstateGroundExtractor } from '../../src/engines/cognitive/az/core/production/AZSubstateGroundExtractor'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
const symbols = new AZSymbolManager()
const wm = new AZWorkingMemory()
const provenance = new AZWmeCausalProvenanceRegistry()
const goals = new AZDefaultGoalIdentityRegistry()
const identifiers = new AZDefaultIdentifierLinkStateRegistry()

const s1 = symbols.makeIdentifier('S')
const s4 = symbols.makeIdentifier('S')
const o2 = symbols.makeIdentifier('O')

goals.registerGoal(s1, 1)
goals.registerGoal(s4, 2)

identifiers.register(s1, { level: 1, promotionLevel: 1 })
identifiers.register(o2, { level: 1, promotionLevel: 1 })
identifiers.register(s4, { level: 2, promotionLevel: 2 })

const operator = symbols.makeStringConstant('operator')
const name = symbols.makeStringConstant('name')
const one = symbols.makeStringConstant('one')
const status = symbols.makeStringConstant('status')
const done = symbols.makeStringConstant('done')

function source(
  identifier: AZSymbol,
  attribute: AZSymbol,
  value: AZSymbol,
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

function positive(
  identifier: AZSymbol,
  attribute: AZSymbol,
  value: AZSymbol,
  wme: ReturnType<AZWorkingMemory['createElement']>,
): AZInstantiatedCondition {
  return {
    type: 'POSITIVE',
    sourceCondition: source(
      identifier,
      attribute,
      value,
    ),
    workingMemoryElement: wme,
  }
}

const operatorWme =
  wm.createElement(
    s1,
    operator,
    o2,
    false,
  )

const nameWme =
  wm.createElement(
    o2,
    name,
    one,
    false,
  )

/*
 * These WMEs already exist at the superstate level.
 * They are terminal grounds: they have no lower-level producer.
 */
provenance.capture(operatorWme, null)
provenance.capture(nameWme, null)

const localWme =
  wm.createElement(
    s4,
    status,
    done,
    false,
  )

const localProducer: AZInstantiation = {
  id: 1,
  production: null,
  instantiatedConditions: [
    positive(s1, operator, o2, operatorWme),
    positive(o2, name, one, nameWme),
  ],
  matchGoal: s4,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

provenance.capture(
  localWme,
  localProducer,
)

const resultInstantiation: AZInstantiation = {
  id: 2,
  production: null,
  instantiatedConditions: [
    positive(s4, status, done, localWme),
  ],
  matchGoal: s4,
  matchGoalLevel: 2,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

const extractor =
  new AZSubstateGroundExtractor(
    provenance,
    identifiers,
  )

const grounds =
  extractor.extract(
    resultInstantiation,
  )

assert.deepEqual(
  grounds,
  [
    operatorWme,
    nameWme,
  ],
  'Local substate dependencies must be backtraced to superstate grounds.',
)

assert.equal(
  grounds.includes(localWme),
  false,
  'A local substate WME must not survive as a justification ground.',
)

console.log('AZ substate causal ground extraction: OK')

//
// Causal graph cycle:
// revisiting the same local WME through producer provenance
// must terminate instead of recursively traversing forever.
//
const cyclicWme = {
  identifier: s4,
  attribute: symbols.makeStringConstant('cycle'),
  value: symbols.makeStringConstant('cycle-value'),
  acceptable: false,
} as typeof localWme

const cyclicProducer = {
  ...localProducer,
  id: 900001,
  instantiatedConditions: [
    {
      type: 'POSITIVE',
      sourceCondition:
        localProducer.instantiatedConditions[0]!.sourceCondition,
      workingMemoryElement: cyclicWme,
    },
  ],
} as typeof localProducer

provenance.capture(
  cyclicWme,
  cyclicProducer,
)

const cyclicResult = {
  ...resultInstantiation,
  id: 900002,
  instantiatedConditions: [
    {
      type: 'POSITIVE',
      sourceCondition:
        resultInstantiation.instantiatedConditions[0]!.sourceCondition,
      workingMemoryElement: cyclicWme,
    },
  ],
} as typeof resultInstantiation

assert.deepEqual(
  extractor.extract(cyclicResult),
  [],
  'Causal ground extraction must terminate when a local WME provenance path cycles',
)

console.log(
  'AZ substate causal cycle termination: OK',
)

//
// Deep acyclic causal lineage:
// extraction must not depend on the JavaScript call-stack depth.
//
const deepGround = operatorWme
let deepWme = deepGround

for (let depth = 0; depth < 20000; depth += 1) {
  const nextLocalWme = {
    identifier: s4,
    attribute: symbols.makeStringConstant(`deep-${depth}`),
    value: symbols.makeStringConstant(`value-${depth}`),
    acceptable: false,
  } as typeof localWme

  const producer = {
    ...localProducer,
    id: 1000000 + depth,
    instantiatedConditions: [
      {
        type: 'POSITIVE',
        sourceCondition:
          localProducer.instantiatedConditions[0]!.sourceCondition,
        workingMemoryElement: deepWme,
      },
    ],
  } as typeof localProducer

  provenance.capture(
    nextLocalWme,
    producer,
  )

  deepWme = nextLocalWme
}

const deepResult = {
  ...resultInstantiation,
  id: 2000000,
  instantiatedConditions: [
    {
      type: 'POSITIVE',
      sourceCondition:
        resultInstantiation.instantiatedConditions[0]!.sourceCondition,
      workingMemoryElement: deepWme,
    },
  ],
} as typeof resultInstantiation

assert.deepEqual(
  extractor.extract(deepResult),
  [deepGround],
  'Causal ground extraction must support deep acyclic provenance without exhausting the JavaScript call stack',
)

console.log(
  'AZ deep causal ground extraction: OK',
)

//
// Structural substate boundary:
// a production matching only the substate ^superstate WME
// must still backtrace through the causally annotated impasse items.
//
const structuralStates =
  new AZDefaultGoalStructuralStateRegistry()

const superstate =
  symbols.makeStringConstant('superstate')

const item =
  symbols.makeStringConstant('item')

const structuralSuperstateWme =
  wm.createElement(
    s4,
    superstate,
    s1,
    false,
  )

const impasseItemWme =
  wm.createElement(
    s4,
    item,
    o2,
    false,
  )

const impasseItemProducer: AZInstantiation = {
  ...localProducer,
  id: 3000001,
  instantiatedConditions: [
    positive(
      s1,
      operator,
      o2,
      operatorWme,
    ),
  ],
}

provenance.capture(
  impasseItemWme,
  impasseItemProducer,
)

structuralStates.register(
  s4,
  {
    impasseWmes: [
      structuralSuperstateWme,
      impasseItemWme,
    ],
  },
)

const structuralResult: AZInstantiation = {
  ...resultInstantiation,
  id: 3000002,
  instantiatedConditions: [
    positive(
      s4,
      superstate,
      s1,
      structuralSuperstateWme,
    ),
  ],
}

const structuralExtractor =
  new AZSubstateGroundExtractor(
    provenance,
    identifiers,
    structuralStates,
  )

assert.deepEqual(
  structuralExtractor.extract(
    structuralResult,
  ),
  [operatorWme],
  'A structural substate dependency must backtrace through causally annotated impasse items to superstate grounds.',
)