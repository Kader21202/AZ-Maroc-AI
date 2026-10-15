import assert from 'node:assert/strict'

import type { AZElaborationRuntimeAssemblyDependencies } from '../../src/engines/cognitive/az/core/cycle/AZElaborationRuntimeAssembly'

type LearningOption = Pick<
  AZElaborationRuntimeAssemblyDependencies,
  'experientialLearningEnabled'
>

const disabled: LearningOption = {
  experientialLearningEnabled: false,
}

const enabled: LearningOption = {
  experientialLearningEnabled: true,
}

assert.equal(disabled.experientialLearningEnabled, false)
assert.equal(enabled.experientialLearningEnabled, true)

console.log('AZ LEARN 02D optional configuration: OK')
