import assert from 'node:assert/strict'

import {
  AZDefaultLinkAdditionProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import {
  AZDefaultLinkRemovalProcessor,
} from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import {
  AZDefaultWorkingMemoryPropagation,
} from '../../src/engines/cognitive/az/core/memory/AZDefaultWorkingMemoryPropagation'
import {
  AZWorkingMemory,
} from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type {
  AZWorkingMemoryElement,
} from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import {
  AZDefaultAlphaMemoryManager,
} from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import {
  AZDefaultReteHashIndex,
} from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZDefaultReteNodeFactory } from '../../src/engines/cognitive/az/core/production/AZDefaultReteNodeFactory'
import {
  AZDefaultWorkingMemoryReteMatcher,
} from '../../src/engines/cognitive/az/core/production/AZDefaultWorkingMemoryReteMatcher'
import {
  AZMatchSet,
} from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import type {
  AZAlphaMemory,
} from '../../src/engines/cognitive/az/core/production/AZAlphaMemory'
import type {
  AZCnNode,
} from '../../src/engines/cognitive/az/core/production/AZCnNode'
import type {
  AZMemoryNode,
} from '../../src/engines/cognitive/az/core/production/AZMemoryNode'
import type {
  AZMpNode,
} from '../../src/engines/cognitive/az/core/production/AZMpNode'
import type {
  AZNegativeNode,
} from '../../src/engines/cognitive/az/core/production/AZNegativeNode'
import type {
  AZPositiveNode,
} from '../../src/engines/cognitive/az/core/production/AZPositiveNode'
import type {
  AZReteActivationEngine,
} from '../../src/engines/cognitive/az/core/production/AZReteActivationEngine'
import type {
  AZReteNode,
} from '../../src/engines/cognitive/az/core/production/AZReteNode'
import type {
  AZToken,
} from '../../src/engines/cognitive/az/core/production/AZToken'
import {
  AZDefaultGoalStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultGoalStateRegistry'
import {
  AZDefaultIdentifierLinkStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import {
  AZDefaultImpasseStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZDefaultImpasseStateRegistry'
import {
  AZSymbolManager,
} from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

class RecordingActivationEngine
  implements AZReteActivationEngine
{
  public positiveCalls = 0
  public removeCalls = 0

  public updateNodeWithMatchesFromAbove(
    _child: AZReteNode,
    _matchSet: AZMatchSet,
  ): void {}

  public removeWorkingMemoryElement(
    _element: AZWorkingMemoryElement,
    _affectedAlphaMemories:
      readonly AZAlphaMemory[],
    _matchSet: AZMatchSet,
  ): void {
    this.removeCalls += 1
  }

  public activatePositiveRight(
    _node: AZPositiveNode,
    _element: AZWorkingMemoryElement,
    _matchSet: AZMatchSet,
  ): readonly AZToken[] {
    this.positiveCalls += 1
    return []
  }

  public activateMpRight(
    _node: AZMpNode,
    _element: AZWorkingMemoryElement,
    _matchSet: AZMatchSet,
  ): readonly AZToken[] {
    return []
  }

  public activateNegativeRight(
    _node: AZNegativeNode,
    _element: AZWorkingMemoryElement,
    _matchSet: AZMatchSet,
  ): readonly AZToken[] {
    return []
  }

  public activateMemoryLeft(
    _node: AZMemoryNode,
    _parentToken: AZToken | null,
    _workingMemoryElement:
      AZWorkingMemoryElement | null,
    _matchSet: AZMatchSet,
  ): AZToken {
    throw new Error('not used')
  }

  public activatePositiveLeft(
    _node: AZPositiveNode,
    _token: AZToken,
    _matchSet: AZMatchSet,
  ): readonly AZWorkingMemoryElement[] {
    return []
  }

  public activateMpLeft(
    _node: AZMpNode,
    _parentToken: AZToken | null,
    _workingMemoryElement:
      AZWorkingMemoryElement | null,
    _matchSet: AZMatchSet,
  ): AZToken {
    throw new Error('not used')
  }

  public activateNegativeLeft(
    _node: AZNegativeNode,
    _parentToken: AZToken | null,
    _workingMemoryElement:
      AZWorkingMemoryElement | null,
    _matchSet: AZMatchSet,
  ): AZToken {
    throw new Error('not used')
  }

  public activateCnLeft(
    _node: AZCnNode,
    _parentToken: AZToken | null,
    _workingMemoryElement:
      AZWorkingMemoryElement | null,
    _matchSet: AZMatchSet,
  ): AZToken {
    throw new Error('not used')
  }

  public activateCnPartnerLeft(
    _node: AZCnNode,
    _parentToken: AZToken,
    _workingMemoryElement:
      AZWorkingMemoryElement | null,
    _matchSet: AZMatchSet,
  ): AZToken {
    throw new Error('not used')
  }
}

const symbols =
  new AZSymbolManager()

const states =
  new AZDefaultIdentifierLinkStateRegistry()

const goals =
  new AZDefaultGoalStateRegistry()

const impasses =
  new AZDefaultImpasseStateRegistry()

const linkAddition =
  new AZDefaultLinkAdditionProcessor(
    states,
    goals,
    impasses,
  )

const linkRemoval =
  new AZDefaultLinkRemovalProcessor(
    states,
    goals,
    impasses,
  )

const workingMemory =
  new AZWorkingMemory(
    linkAddition,
    linkRemoval,
  )

const hashIndex =
  new AZDefaultReteHashIndex()

const alphaMemoryManager =
  new AZDefaultAlphaMemoryManager(
    workingMemory,
    hashIndex,
  )

const activationEngine =
  new RecordingActivationEngine()

const matchSet =
  new AZMatchSet()

const matcher =
  new AZDefaultWorkingMemoryReteMatcher(
    alphaMemoryManager,
    activationEngine,
    matchSet,
  )

workingMemory.setPropagation(
  new AZDefaultWorkingMemoryPropagation(
    matcher,
  ),
)

const source =
  symbols.makeIdentifier('S')

const target =
  symbols.makeIdentifier('T')

const attribute =
  symbols.makeStringConstant('child')

states.register(source, {
  level: 1,
  promotionLevel: 1,
})

states.register(target, {
  level: 1,
  promotionLevel: 1,
})

const alpha =
  alphaMemoryManager.findOrCreate(
    source,
    attribute,
    target,
    false,
  )

const reteNodeFactory =
  new AZDefaultReteNodeFactory()

const reteTop =
  reteNodeFactory.createDummyTopNode()

const reteMemory =
  reteNodeFactory.createMemoryNode(
    reteTop,
    false,
    {
      fieldNumber: 0,
      levelsUp: 0,
    },
  )

const positiveNode =
  reteNodeFactory.createPositiveNode(
    reteMemory,
    false,
    alpha,
    [],
  )

const wme =
  workingMemory.createElement(
    source,
    attribute,
    target,
  )

// Structural link effect happens at scheduling time.
workingMemory.scheduleAdd(wme)

assert.equal(
  states.get(target).linkCount,
  1,
)

assert.equal(
  activationEngine.positiveCalls,
  0,
)

// RETE propagation happens when buffered changes are applied.
workingMemory.applyBufferedChanges()

assert.equal(
  activationEngine.positiveCalls,
  1,
)

assert.equal(
  workingMemory.getElements()
    .includes(wme),
  true,
)

assert.equal(
  alpha.getRightMemories().length,
  1,
)

// Structural removal effect also happens immediately.
workingMemory.scheduleRemove(wme)

assert.equal(
  states.get(target).linkCount,
  0,
)

assert.equal(
  processorUnknownCount(linkRemoval),
  1,
)

assert.equal(
  activationEngine.removeCalls,
  0,
)

// RETE removal happens on buffered apply.
workingMemory.applyBufferedChanges()

assert.equal(
  activationEngine.removeCalls,
  1,
)

assert.equal(
  workingMemory.getElements()
    .includes(wme),
  false,
)

assert.equal(
  alpha.getRightMemories().length,
  0,
)

console.log(
  'AZ working-memory structural-link and RETE lifecycle: OK',
)

function processorUnknownCount(
  processor: AZDefaultLinkRemovalProcessor,
): number {
  return processor
    .getUnknownLevelIdentifiers()
    .length
}
