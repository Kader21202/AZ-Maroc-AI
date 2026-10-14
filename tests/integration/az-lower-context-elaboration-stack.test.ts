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

runtime.stateStack.setTop(
  { kind: 'root-state' },
  rootGoal,
)

const lowerContext =
  runtime.decisionRuntime.lowerContextCreator.create(
    rootContext,
    runtime.predefinedSymbols.operator,
    'TIE',
  )

assert.equal(
  runtime.goalStateRegistry.getLevel(lowerContext.goal),
  2,
  'real lower-context creation must register the lower goal at level 2',
)

assert.equal(
  runtime.contextStack.bottom?.goal,
  lowerContext.goal,
  'real lower-context creation must append the lower goal to the decision context stack',
)

assert.notEqual(
  runtime.stateStack.findByGoal(lowerContext.goal),
  null,
  'a naturally created lower goal must also be visible to the elaboration state stack',
)

console.log(
  'AZ lower context is visible to elaboration state stack: OK',
)
