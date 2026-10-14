import assert from 'node:assert/strict'

import { AZDefaultCognitiveRunControl } from '../../src/engines/cognitive/az/core/cycle/AZDefaultCognitiveRunControl'
import { AZBoundedGoalDepthPolicy } from '../../src/engines/cognitive/az/core/state/AZGoalDepthPolicy'

import type { AZContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceSemantics'
import type { AZContextPreferenceSemanticsResult } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceSemanticsResult'
import { AZContextSlotDecider } from '../../src/engines/cognitive/az/core/decision/AZContextSlotDecider'
import type { AZContextDecisionObservation } from '../../src/engines/cognitive/az/core/decision/AZContextDecisionObserver'
import { AZContextSlotWmeRemover } from '../../src/engines/cognitive/az/core/decision/AZContextSlotWmeRemover'
import { AZContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZContextPreferenceWmeRegistry'
import type { AZImpasseItemsUpdater } from '../../src/engines/cognitive/az/core/decision/AZImpasseItemsUpdater'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZPreferenceSlot } from '../../src/engines/cognitive/az/core/operator/AZPreferenceSlot'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type { AZExistingContextRemover } from '../../src/engines/cognitive/az/core/state/AZExistingContextRemover'
import { AZGoalContextStack } from '../../src/engines/cognitive/az/core/state/AZGoalContextStack'
import {
  AZDefaultGoalStructuralStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import type { AZLowerContextCreator } from '../../src/engines/cognitive/az/core/state/AZLowerContextCreator'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

const contextStack =
  new AZGoalContextStack()

const structuralRegistry =
  new AZDefaultGoalStructuralStateRegistry()

const state =
  symbols.makeIdentifier('S')

const operator =
  symbols.makeStringConstant(
    'operator',
  )

const stateAttribute =
  symbols.makeStringConstant('state')

const o1 =
  symbols.makeIdentifier('O')

const o2 =
  symbols.makeIdentifier('O')

const parent =
  contextStack.setTop(state)

structuralRegistry.register(state)
function requireLowerGoal() {
  const lower =
    contextStack.bottom

  if (
    lower === null ||
    lower === parent
  ) {
    throw new Error(
      'Expected lower goal context',
    )
  }

  return lower.goal
}

const slot: AZPreferenceSlot = {
  identifier: state,
  attribute: operator,
  allPreferences: [],
  preferencesByType:
    new Map(),
  wmes: [],
  isaContextSlot: true,
  impasseType: 'NONE',
  impasseId: null,
  acceptablePreferenceChanged: false,
  acceptablePreferenceWmes: [],
  changed: true,
  markedForPossibleRemoval: false,
}

function candidate(
  value: typeof o1,
): AZPreference {
  return {
    type: 'ACCEPTABLE',
    identifier: state,
    attribute: operator,
    value,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: true,
    slot,
    instantiation: null,
  }
}

const candidateO1 =
  candidate(o1)

const candidateO2 =
  candidate(o2)

let semanticResult: AZContextPreferenceSemanticsResult = {
  impasseType: 'NONE',
  candidates:
    [candidateO1] as readonly AZPreference[],
}

const semantics = {
  evaluate() {
    return semanticResult
  },
} as AZContextPreferenceSemantics

let removeCount = 0
let createCount = 0

const removedGoals:
  Array<typeof state> = []

const existingContextRemover = {
  remove(
    goal: typeof state,
  ): boolean {
    removeCount += 1
    removedGoals.push(goal)

    structuralRegistry.remove(goal)

    return contextStack.truncateFrom(
      goal,
    )
  },
} as unknown as AZExistingContextRemover

const lowerContextCreator = {
  create(
    targetParent: typeof parent,
    attribute: typeof operator,
    type:
      | 'CONSTRAINT_FAILURE'
      | 'CONFLICT'
      | 'TIE'
      | 'NO_CHANGE',
  ) {
    createCount += 1

    const goal =
      symbols.makeIdentifier('S')

    const created =
      contextStack.appendLower(
        targetParent,
        goal,
      )

    structuralRegistry.register(
      goal,
      {
        impasseType:
          type === 'NO_CHANGE'
            ? 'ONC'
            : type,
        impasseAttribute:
          attribute,
      },
    )

    return created
  },
} as unknown as AZLowerContextCreator

const updates:
  Array<{
    goal: typeof state
    values: readonly typeof o1[]
  }> = []

const impasseItemsUpdater = {
  update(
    goal: typeof state,
    candidates:
      readonly AZPreference[],
  ): void {
    updates.push({
      goal,
      values:
        candidates.map(
          item => item.value,
        ),
    })
  },
} as unknown as AZImpasseItemsUpdater

const contextPreferenceWmeRegistry =
  new AZContextPreferenceWmeRegistry()

const observations:
  AZContextDecisionObservation[] = []

const observer = {
  observe(
    observation: AZContextDecisionObservation,
  ): void {
    observations.push(observation)
  },
}

let simulatedCreatedGoalLevel = 1

const goalDepthPolicy =
  new AZBoundedGoalDepthPolicy(100)

const goalDepthRunControl =
  new AZDefaultCognitiveRunControl()

const goalDepthStateRegistry = {
  isGoal(): boolean {
    return true
  },

  getLevel(): number {
    return simulatedCreatedGoalLevel
  },

  registerGoal(): void {},

  removeGoal(): void {},
}

const decider =
  new AZContextSlotDecider(
    semantics,
    contextStack,
    structuralRegistry,
    lowerContextCreator,
    existingContextRemover,
    new AZContextSlotWmeRemover(
      contextPreferenceWmeRegistry,
    ),
    contextPreferenceWmeRegistry,
    impasseItemsUpdater,
    stateAttribute,
    observer,
    {
      policy: goalDepthPolicy,
      goalStateRegistry:
        goalDepthStateRegistry,
      runControl:
        goalDepthRunControl,
    },
  )

/*
 * Winner O1.
 */
let changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(slot.wmes.length, 1)
assert.equal(slot.wmes[0]?.value, o1)
assert.equal(
  contextPreferenceWmeRegistry.get(
    slot.wmes[0]!,
  ),
  candidateO1,
)
assert.equal(parent.lower, null)
assert.equal(slot.impasseType, 'NONE')
assert.equal(slot.impasseId, null)

workingMemory.applyBufferedChanges()

/*
 * Same winner: AZ replaces the selected operator WME.
 */
const firstOperatorWme =
  slot.wmes[0]

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(slot.wmes.length, 1)
assert.equal(slot.wmes[0]?.value, o1)
assert.notEqual(
  slot.wmes[0],
  firstOperatorWme,
)
assert.equal(
  contextPreferenceWmeRegistry.get(
    firstOperatorWme!,
  ),
  null,
)
assert.equal(
  contextPreferenceWmeRegistry.get(
    slot.wmes[0]!,
  ),
  candidateO1,
)
/*
 * Different winner: replace operator WME.
 */
semanticResult = {
  impasseType: 'NONE',
  candidates: [candidateO2],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(slot.wmes.length, 1)
assert.equal(slot.wmes[0]?.value, o2)
assert.notEqual(
  slot.wmes[0],
  firstOperatorWme,
)
assert.equal(
  contextPreferenceWmeRegistry.get(
    firstOperatorWme!,
  ),
  null,
)
assert.equal(
  contextPreferenceWmeRegistry.get(
    slot.wmes[0]!,
  ),
  candidateO2,
)

workingMemory.applyBufferedChanges()

/*
 * TIE: remove selected operator,
 * create lower context and populate items.
 */
const secondOperatorWme =
  slot.wmes[0]

semanticResult = {
  impasseType: 'TIE',
  candidates: [
    candidateO1,
    candidateO2,
  ],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(slot.wmes.length, 0)
assert.equal(
  contextPreferenceWmeRegistry.get(
    secondOperatorWme!,
  ),
  null,
)
assert.equal(createCount, 1)
assert.ok(parent.lower)

const tieGoal =
  requireLowerGoal()

assert.equal(slot.impasseType, 'TIE')
assert.equal(slot.impasseId, tieGoal)
assert.equal(updates.length, 1)
assert.equal(updates[0]?.goal, tieGoal)
assert.deepEqual(
  updates[0]?.values,
  [o1, o2],
)

/*
 * Same TIE: preserve lower context,
 * refresh only impasse items.
 */
changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, false)
assert.equal(requireLowerGoal(), tieGoal)
assert.equal(createCount, 1)
assert.equal(removeCount, 0)
assert.equal(updates.length, 2)

/*
 * Different impasse: replace lower context.
 */
semanticResult = {
  impasseType: 'CONFLICT',
  candidates: [
    candidateO1,
    candidateO2,
  ],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(removeCount, 1)
assert.equal(
  removedGoals[0],
  tieGoal,
)
assert.equal(createCount, 2)
assert.ok(parent.lower)

const conflictGoal =
  requireLowerGoal()

assert.notEqual(
  conflictGoal,
  tieGoal,
)

assert.equal(
  structuralRegistry
    .get(conflictGoal)
    .impasseType,
  'CONFLICT',
)

/*
 * NO_CHANGE uses ONC structural state.
 */
semanticResult = {
  impasseType: 'NO_CHANGE',
  candidates: [],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(createCount, 3)
assert.ok(parent.lower)

const noChangeGoal =
  requireLowerGoal()

assert.equal(
  structuralRegistry
    .get(noChangeGoal)
    .impasseType,
  'ONC',
)

assert.equal(
  slot.impasseType,
  'NO_CHANGE',
)

assert.equal(
  slot.impasseId,
  noChangeGoal,
)

assert.deepEqual(
  observations,
  [
    { type: 'OPERATOR_SELECTED', operatorId: o1.id },
    { type: 'OPERATOR_SELECTED', operatorId: o1.id },
    { type: 'OPERATOR_SELECTED', operatorId: o2.id },
    { type: 'IMPASSE_DETECTED', impasseType: 'TIE' },
    { type: 'IMPASSE_DETECTED', impasseType: 'TIE' },
    { type: 'IMPASSE_DETECTED', impasseType: 'CONFLICT' },
    { type: 'IMPASSE_DETECTED', impasseType: 'ONC' },
  ],
  'AZ context observer must report selections and impasses, including NO_CHANGE as ONC',
)

/*
 * Winner after impasse:
 * remove lower branch and install O1.
 */
semanticResult = {
  impasseType: 'NONE',
  candidates: [candidateO1],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(parent.lower, null)
assert.equal(slot.wmes.length, 1)
assert.equal(slot.wmes[0]?.value, o1)
assert.equal(
  contextPreferenceWmeRegistry.get(
    slot.wmes[0]!,
  ),
  candidateO1,
)
assert.equal(slot.impasseType, 'NONE')
assert.equal(slot.impasseId, null)

workingMemory.applyBufferedChanges()

/*
 * Goal-depth boundary:
 * level 100 is allowed.
 */
simulatedCreatedGoalLevel = 100

semanticResult = {
  impasseType: 'NO_CHANGE',
  candidates: [],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(
  goalDepthRunControl.isHalted(),
  false,
)

/*
 * Level 101 alone must not halt for a TIE.
 * The historical depth rule applies only to newly
 * created NO_CHANGE lower contexts.
 */
simulatedCreatedGoalLevel = 101

semanticResult = {
  impasseType: 'TIE',
  candidates: [
    candidateO1,
    candidateO2,
  ],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(
  goalDepthRunControl.isHalted(),
  false,
)

/*
 * A newly created NO_CHANGE context at level 101
 * crosses the configured limit immediately.
 */
semanticResult = {
  impasseType: 'NO_CHANGE',
  candidates: [],
}

changed =
  decider.decide(
    slot,
    workingMemory,
    matchSet,
  )

assert.equal(changed, true)
assert.equal(
  goalDepthRunControl.isHalted(),
  true,
)
assert.equal(
  goalDepthRunControl.reasonForStopping(),
  'Max goal depth exceeded.',
)

console.log(
  'AZ context slot decider: OK',
)

/*
 * Context replacement ordering.
 *
 * A decidable parent operator slot has both an existing selected
 * operator and a lower context.  The selected WME must be removed
 * before the lower context is removed.
 */
{
  const orderState =
    symbols.makeIdentifier('S')

  const orderO1 =
    symbols.makeIdentifier('O')

  const orderO2 =
    symbols.makeIdentifier('O')

  const orderContextStack = new AZGoalContextStack()

  const orderParent =
    orderContextStack.setTop(orderState)

  structuralRegistry.register(orderState)

  const orderSlot: AZPreferenceSlot = {
    identifier: orderState,
    attribute: operator,
    allPreferences: [],
    preferencesByType: new Map(),
    wmes: [],
    isaContextSlot: true,
    impasseType: 'NONE',
    impasseId: null,
    acceptablePreferenceChanged: false,
    acceptablePreferenceWmes: [],
    changed: true,
    markedForPossibleRemoval: false,
  }

  const oldWme =
    workingMemory.createElement(
      orderState,
      operator,
      orderO1,
      false,
    )

  orderSlot.wmes.push(oldWme)
  workingMemory.scheduleAdd(oldWme)
  workingMemory.applyBufferedChanges()

  const lowerGoal =
    symbols.makeIdentifier('S')

  orderContextStack.appendLower(
    orderParent,
    lowerGoal,
  )

  structuralRegistry.register(lowerGoal)

  const orderCandidate: AZPreference = {
    type: 'ACCEPTABLE',
    identifier: orderState,
    attribute: operator,
    value: orderO2,
    referent: null,
    level: 1,
    numericValue: 0,
    oSupported: false,
    inTemporaryMemory: true,
    slot: orderSlot,
    instantiation: null,
  }

  const events: string[] = []

  const orderExistingContextRemover = {
    remove(): boolean {
      events.push('remove-lower-context')
      structuralRegistry.remove(lowerGoal)
      return orderContextStack.truncateFrom(
        lowerGoal,
      )
    },
  } as unknown as AZExistingContextRemover

  const orderWmeRemover = {
    remove(
      targetSlot: AZPreferenceSlot,
      targetWorkingMemory: AZWorkingMemory,
    ): void {
      events.push('remove-parent-selected-wme')

      const wme =
        targetSlot.wmes[0]

      if (wme === undefined) {
        return
      }

      targetSlot.wmes.length = 0
      contextPreferenceWmeRegistry.remove(wme)
      targetWorkingMemory.scheduleRemove(wme)
    },
  } as unknown as AZContextSlotWmeRemover

  const orderSemantics = {
    evaluate(): AZContextPreferenceSemanticsResult {
      return {
        impasseType: 'NONE',
        candidates: [orderCandidate],
      }
    },
  } as AZContextPreferenceSemantics

  const orderDecider =
    new AZContextSlotDecider(
      orderSemantics,
      orderContextStack,
      structuralRegistry,
      lowerContextCreator,
      orderExistingContextRemover,
      orderWmeRemover,
      contextPreferenceWmeRegistry,
      impasseItemsUpdater,
      stateAttribute,
    )

  orderDecider.decide(
    orderSlot,
    workingMemory,
    matchSet,
  )

  assert.deepEqual(
    events,
    [
      'remove-parent-selected-wme',
      'remove-lower-context',
    ],
    'AZ context replacement must remove the selected parent WME before the lower context',
  )
}



/*
 * AZ decision invariant: NONE with no winner is converted to NO_CHANGE.
 * The previously selected context-slot WME is removed before
 * the no-change impasse is established.
 */
{
  const noWinnerState =
    symbols.makeIdentifier('S')

  const noWinnerOldOperator =
    symbols.makeIdentifier('O')

  const noWinnerStack =
    new AZGoalContextStack()

  const noWinnerParent =
    noWinnerStack.setTop(noWinnerState)

  structuralRegistry.register(noWinnerState)

  const noWinnerSlot: AZPreferenceSlot = {
    identifier: noWinnerState,
    attribute: operator,
    allPreferences: [],
    preferencesByType: new Map(),
    wmes: [],
    isaContextSlot: true,
    impasseType: 'NONE',
    impasseId: null,
    acceptablePreferenceChanged: false,
    acceptablePreferenceWmes: [],
    changed: true,
    markedForPossibleRemoval: false,
  }

  const oldWme =
    workingMemory.createElement(
      noWinnerState,
      operator,
      noWinnerOldOperator,
      false,
    )

  noWinnerSlot.wmes.push(oldWme)
  workingMemory.scheduleAdd(oldWme)
  workingMemory.applyBufferedChanges()

  const parentOperatorSlot: AZPreferenceSlot = {
    identifier: noWinnerState,
    attribute: operator,
    allPreferences: [],
    preferencesByType: new Map(),
    wmes: [],
    isaContextSlot: true,
    impasseType: 'NONE',
    impasseId: null,
    acceptablePreferenceChanged: false,
    acceptablePreferenceWmes: [],
    changed: false,
    markedForPossibleRemoval: false,
  }

  const parentSelectedOperator =
    symbols.makeIdentifier('O')

  const parentOperatorWme =
    workingMemory.createElement(
      noWinnerState,
      operator,
      parentSelectedOperator,
      false,
    )

  parentOperatorSlot.wmes.push(parentOperatorWme)
  workingMemory.scheduleAdd(parentOperatorWme)
  workingMemory.applyBufferedChanges()

  structuralRegistry.get(noWinnerState).operatorSlot =
    parentOperatorSlot
  const noWinnerSemantics = {
    evaluate(): AZContextPreferenceSemanticsResult {
      return {
        impasseType: 'NONE',
        candidates: [],
      }
    },
  } as AZContextPreferenceSemantics

  let createdImpasseType: string | null = null
  let createdImpasseAttribute: unknown = null
  const noWinnerLowerContextCreator = {
    create(
      targetParent: typeof noWinnerParent,
      attribute: typeof operator,
      type: 'CONSTRAINT_FAILURE' | 'CONFLICT' | 'TIE' | 'NO_CHANGE',
    ) {
      createdImpasseType = type
      createdImpasseAttribute = attribute
      const goal =
        symbols.makeIdentifier('S')

      const created =
        noWinnerStack.appendLower(
          targetParent,
          goal,
        )

      structuralRegistry.register(
        goal,
        {
          impasseType:
            type === 'NO_CHANGE'
              ? 'ONC'
              : type,
          impasseAttribute: attribute,
        },
      )

      return created
    },
  } as unknown as AZLowerContextCreator

  const noWinnerDecider =
    new AZContextSlotDecider(
      noWinnerSemantics,
      noWinnerStack,
      structuralRegistry,
      noWinnerLowerContextCreator,
      existingContextRemover,
      new AZContextSlotWmeRemover(
        contextPreferenceWmeRegistry,
      ),
      contextPreferenceWmeRegistry,
      impasseItemsUpdater,
      stateAttribute,
    )

  const noWinnerChanged =
    noWinnerDecider.decide(
      noWinnerSlot,
      workingMemory,
      matchSet,
    )

  assert.equal(noWinnerChanged, true)
  assert.equal(noWinnerSlot.wmes.length, 0)
  assert.equal(parentOperatorSlot.wmes.length, 0)
  assert.equal(
    contextPreferenceWmeRegistry.get(oldWme),
    null,
  )
  assert.equal(createdImpasseType, 'NO_CHANGE')
  assert.equal(
    (createdImpasseAttribute as { value: unknown }).value,
    'state',
  )
  assert.equal(noWinnerSlot.impasseType, 'NO_CHANGE')
  assert.ok(noWinnerParent.lower)
}

