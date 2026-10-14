import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'

const runtime =
  new AZCognitiveRuntimeAssembly()

// Public composition contracts.
assert.equal(
  runtime.phaseRuntime.ioState,
  runtime.ioState,
)

assert.equal(
  runtime.phaseRuntime.outputLinkManager,
  runtime.outputLinkManager,
)

assert.equal(
  runtime.productionRuntime.matchSet,
  runtime.productionRuntime.productionMatcher
    .getMatchSet(),
)

// Establish one completely generic top-level goal.
const rootGoal =
  runtime.symbolManager.makeIdentifier('S')

runtime.identifierStateRegistry.register(
  rootGoal,
  {
    level: 1,
    promotionLevel: 1,
  },
)

runtime.goalStateRegistry.registerGoal(
  rootGoal,
  1,
)

runtime.structuralRegistry.register(
  rootGoal,
)

runtime.contextStack.setTop(rootGoal)

runtime.stateStack.setTop(
  {},
  rootGoal,
)

// Goal state is visible through the shared registry.
assert.equal(
  runtime.goalStateRegistry.isGoal(
    rootGoal,
  ),
  true,
)

assert.equal(
  runtime.goalStateRegistry.getLevel(
    rootGoal,
  ),
  1,
)

assert.equal(
  runtime.contextStack.findByGoal(
    rootGoal,
  )?.goal,
  rootGoal,
)

assert.equal(
  runtime.stateStack.findByGoal(
    rootGoal,
  )?.goal,
  rootGoal,
)

// Verify that working memory uses the shared structural
// link processors and therefore updates the same
// identifier-state registry.
const child =
  runtime.symbolManager.makeIdentifier('C')

runtime.identifierStateRegistry.register(
  child,
  {
    level: 1,
    promotionLevel: 1,
  },
)

const attribute =
  runtime.symbolManager.makeStringConstant(
    'child',
  )

const wme =
  runtime.workingMemory.createElement(
    rootGoal,
    attribute,
    child,
  )

runtime.workingMemory.scheduleAdd(wme)

assert.equal(
  runtime.identifierStateRegistry
    .get(child)
    .linkCount,
  1,
)

runtime.workingMemory.applyBufferedChanges()

assert.equal(
  runtime.workingMemory
    .getElements()
    .includes(wme),
  true,
)

// Removal must travel through the same shared link
// lifecycle.
runtime.workingMemory.scheduleRemove(wme)

assert.equal(
  runtime.identifierStateRegistry
    .get(child)
    .linkCount,
  0,
)

runtime.workingMemory.applyBufferedChanges()

assert.equal(
  runtime.workingMemory
    .getElements()
    .includes(wme),
  false,
)

console.log(
  'AZ cognitive runtime assembly: OK',
)
