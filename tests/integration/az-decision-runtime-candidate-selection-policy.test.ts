import assert from 'node:assert/strict'
import { AZDecisionRuntimeAssembly } from '../../src/engines/cognitive/az/core/decision/AZDecisionRuntimeAssembly'
import { AZDefaultCandidateSelectionPolicy } from '../../src/engines/cognitive/az/core/decision/AZDefaultCandidateSelectionPolicy'
import type { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultGoalStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZContextChangeTracker } from '../../src/engines/cognitive/az/core/state/AZContextChangeTracker'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZDefaultGoalStructuralStateRegistry } from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZDefaultImpasseStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbolManager =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbolManager,
  )

const preferenceMemory =
  new AZPreferenceMemory()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const goalStateRegistry =
  new AZDefaultGoalStateRegistry()

const goalIdentityRegistry =
  new AZDefaultGoalIdentityRegistry()

const contextChangeTracker =
  new AZContextChangeTracker(
    goalStateRegistry,
  )

let randomCalls = 0

const contextStack =
  new AZGoalContextStack()

const stateStack =
  new AZStateStack()

const candidateSelectionPolicy =
  new AZDefaultCandidateSelectionPolicy(
    () => {
      randomCalls += 1
      return 0.75
    },
  )

const decision =
  new AZDecisionRuntimeAssembly({
    symbolManager,
    predefinedSymbols,
    preferenceMemory,
    workingMemory,
    matchSet,
    contextStack,
    stateStack,
    contextChangeTracker,
    goalStateRegistry,
    goalIdentityRegistry,
    identifierStateRegistry:
      new AZDefaultIdentifierLinkStateRegistry(),
    structuralRegistry:
      new AZDefaultGoalStructuralStateRegistry(),
    impasseRegistry:
      new AZDefaultImpasseStateRegistry(),
    bufferedLinkChangesProcessor: {
      process(): void {},
    } as AZBufferedLinkChangesProcessor,
    candidateSelectionPolicy,
  })

const rootGoal =
  symbolManager.makeIdentifier('S')

const operatorSlot =
  decision.goalContextInitializer.initialize(
    rootGoal,
    1,
  )
contextStack.setTop(rootGoal)

stateStack.setTop(
  {},
  rootGoal,
)

const o1 =
  symbolManager.makeIdentifier('O')

const o2 =
  symbolManager.makeIdentifier('O')

const numeric10 =
  symbolManager.makeIntegerConstant(10)

const numeric20 =
  symbolManager.makeIntegerConstant(20)

const generatedPreferences:
  AZPreference[] = []

const instantiation:
  AZInstantiation = {
    id: 1,
    production: null,
    instantiatedConditions: [],
    matchGoal: rootGoal,
    matchGoalLevel: 1,
    inMatchSet: true,
    generatedPreferences,
    reteToken: null,
    reteWme: null,
  }

function makePreference(
  type: AZPreference['type'],
  value: AZPreference['value'],
  referent: AZPreference['referent'] = null,
): AZPreference {
  return {
    type,
    identifier: rootGoal,
    attribute: predefinedSymbols.operator,
    value,
    referent,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: false,
    slot: null,
    instantiation,
  }
}

const acceptableO1 =
  makePreference(
    'ACCEPTABLE',
    o1,
  )

const acceptableO2 =
  makePreference(
    'ACCEPTABLE',
    o2,
  )

const numericO1 =
  makePreference(
    'NUMERIC_INDIFFERENT',
    o1,
    numeric10,
  )

const numericO2 =
  makePreference(
    'NUMERIC_INDIFFERENT',
    o2,
    numeric20,
  )

generatedPreferences.push(
  acceptableO1,
  acceptableO2,
  numericO1,
  numericO2,
)

for (
  const preference of
  generatedPreferences
) {
  preferenceMemory.add(
    preference,
  )
}

assert.equal(
  operatorSlot,
  preferenceMemory.getSlot(
    rootGoal,
    predefinedSymbols.operator,
  ),
  'preferences must enter the real operator context slot',
)

const acceptableOrder =
  operatorSlot.preferencesByType.get(
    'ACCEPTABLE',
  ) ?? []

assert.deepEqual(
  acceptableOrder.map(
    preference => preference.value,
  ),
  [o2, o1],
  'PreferenceMemory must expose the real runtime candidate order',
)

decision.decideRuntime.execute()

workingMemory.applyBufferedChanges()

assert.equal(
  randomCalls,
  1,
  'one stochastic draw must be consumed by the real AZ selection policy',
)

const selectedOperatorWmes =
  workingMemory
    .getElements()
    .filter(
      wme =>
        wme.identifier === rootGoal &&
        wme.attribute ===
          predefinedSymbols.operator &&
        wme.acceptable === false,
    )

assert.equal(
  selectedOperatorWmes.length,
  1,
  'DECIDE must materialize exactly one selected operator',
)

assert.equal(
  selectedOperatorWmes[0]!.value,
  o1,
  'random 0.75 over runtime candidate order o2(20), o1(10) must select o1',
)

assert.equal(
  selectedOperatorWmes.some(
    wme => wme.value === o2,
  ),
  false,
  'O2 must not be materialized as the selected operator',
)

assert.equal(
  operatorSlot.impasseType,
  'NONE',
  'successful stochastic selection must not create an impasse',
)

console.log(
  'AZ decision runtime controlled candidate selection: OK',
)
