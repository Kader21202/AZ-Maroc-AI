import assert from 'node:assert/strict'

import { AZCognitiveRuntimeAssembly } from '../../src/engines/cognitive/az/core/AZCognitiveRuntimeAssembly'
import type { AZProductionDescriptor } from '../../src/engines/cognitive/az/core/production/AZProductionDescriptor'

const runtime = new AZCognitiveRuntimeAssembly()

const rootGoal = runtime.symbolManager.makeIdentifier('S')

runtime.decisionRuntime.goalContextInitializer.initialize(rootGoal, 1)
runtime.contextStack.setTop(rootGoal)
runtime.stateStack.setTop({}, rootGoal)

const name = runtime.symbolManager.makeStringConstant('name')
const count = runtime.symbolManager.makeStringConstant('count')
const probeName = runtime.symbolManager.makeStringConstant('count-and-die-rhs-probe')
const one = runtime.symbolManager.makeIntegerConstant(1)
const plus = runtime.symbolManager.makeStringConstant('+')

const s = runtime.symbolManager.makeVariable('s')
const ct = runtime.symbolManager.makeVariable('ct')

runtime.workingMemory.scheduleAdd(
  runtime.workingMemory.createElement(rootGoal, name, probeName, false),
)
runtime.workingMemory.scheduleAdd(
  runtime.workingMemory.createElement(rootGoal, count, one, false),
)
runtime.workingMemory.applyBufferedChanges()

const production: AZProductionDescriptor = {
  name: 'az-count-and-die-rhs-addition-red',
  declaredSupport: 'O_SUPPORT',
  conditions: [
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: s },
      attributeTest: { type: 'EQUALITY', referent: name },
      valueTest: { type: 'EQUALITY', referent: probeName },
      acceptable: false,
    },
    {
      type: 'POSITIVE',
      identifierTest: { type: 'EQUALITY', referent: s },
      attributeTest: { type: 'EQUALITY', referent: count },
      valueTest: { type: 'EQUALITY', referent: ct },
      acceptable: false,
    },
  ],
  actions: [
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: s },
      attribute: { type: 'SYMBOL', symbol: count },
      value: {
        type: 'FUNCALL',
        functionName: plus,
        arguments: [
          { type: 'SYMBOL', symbol: ct },
          { type: 'SYMBOL', symbol: one },
        ],
      },
      support: 'UNKNOWN',
    },
  ],
}

runtime.productionRuntime.productionInstaller.install(
  runtime.productionRuntime.productionMaterializer.materialize(production),
)

let executionError: unknown = null

try {
  for (let step = 0; step < 8; step += 1) {
    console.log('BEFORE', step, 'PHASE=', runtime.phaseRuntime.controller.currentPhase, 'WM=', runtime.workingMemory.getElements().map(w => ({id:w.identifier.value,a:w.attribute.value,v:w.value.value,acc:w.acceptable}))); const phaseResult = runtime.phaseRuntime.phaseExecutor.executeOnePhase(); console.log('AFTER', step, 'EXECUTED=', phaseResult.executedPhase, 'NEXT=', phaseResult.nextPhase, 'ELAB=', phaseResult.elaboration); if (phaseResult.elaboration) console.dir(phaseResult.elaboration.waterfall.createdInstantiations, {depth:6})
  }
} catch (error) {
  executionError = error
}

if (executionError !== null) {
  throw executionError
}

const counts = runtime.workingMemory
  .getElements()
  .filter(
    wme =>
      wme.identifier === rootGoal &&
      wme.attribute === count,
  )

assert.ok(
  counts.some(
    wme =>
      wme.value.type === 'INTEGER_CONSTANT' &&
      wme.value.value === 2,
  ),
  'AZ must execute the count-and-die RHS addition (+ <ct> 1)',
)

console.log('AZ count-and-die RHS addition: OK')
