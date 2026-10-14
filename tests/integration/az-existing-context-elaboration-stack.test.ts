import assert from 'node:assert/strict'
import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'

const runtime = new AZCognitiveRuntimeAssembly()

const rootGoal =
  runtime.symbolManager.makeIdentifier('S')

runtime.decisionRuntime.goalContextInitializer.initialize(
  rootGoal,
  1,
)

const rootContext =
  runtime.contextStack.setTop(rootGoal)

runtime.stateStack.setTop({}, rootGoal)

const lowerContext =
  runtime.decisionRuntime.lowerContextCreator.create(
    rootContext,
    runtime.predefinedSymbols.operator,
    'TIE',
  )


assert.notEqual(
  runtime.stateStack.findByGoal(lowerContext.goal),
  null,
)

const removed =
  runtime.decisionRuntime.existingContextRemover.remove(
    lowerContext.goal,
    runtime.workingMemory,
    runtime.productionRuntime.matchSet,
  )

assert.equal(
  removed,
  true,
  'real existing-context removal must report successful branch removal',
)

assert.equal(
  runtime.contextStack.findByGoal(lowerContext.goal),
  null,
  'removed lower goal must disappear from the decision context stack',
)

assert.equal(
  runtime.stateStack.findByGoal(lowerContext.goal),
  null,
  'removed lower goal must also disappear from the elaboration state stack',
)

console.log(
  'AZ removed context disappears from elaboration state stack: OK',
)
