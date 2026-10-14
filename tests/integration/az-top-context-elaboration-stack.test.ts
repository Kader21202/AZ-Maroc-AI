import assert from 'node:assert/strict'
import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import { AZTopContextCreator } from '../../src/engines/cognitive/az/core/state/AZTopContextCreator'

const runtime =
  new AZCognitiveRuntimeAssembly()

const creator =
  new AZTopContextCreator(
    runtime.symbolManager,
    runtime.predefinedSymbols,
    runtime.workingMemory,
    runtime.contextStack,
    runtime.stateStack,
    runtime.decisionRuntime.goalContextInitializer,
    runtime.structuralRegistry,
  )

const top =
  creator.create()

assert.equal(
  runtime.contextStack.top,
  top,
)

assert.notEqual(
  runtime.stateStack.findByGoal(top.goal),
  null,
  'a naturally created top goal must also be visible to the elaboration state stack',
)

console.log(
  'AZ top context is visible to elaboration state stack: OK',
)
