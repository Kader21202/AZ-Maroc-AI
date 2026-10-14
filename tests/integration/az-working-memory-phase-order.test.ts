import assert from 'node:assert/strict'
import { AZNonContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceSemantics'
import { AZNonContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceWmeRegistry'
import { AZNonContextSlotDecider, AZNonContextSlotsDecider } from '../../src/engines/cognitive/az/core/decision/AZNonContextSlotDecider'
import { AZAcceptablePreferenceWmeChangesProcessor, AZAcceptablePreferenceWmeSynchronizer } from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeSynchronizer'
import { AZAcceptablePreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeRegistry'
import { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZPreference } from '../../src/engines/cognitive/az/core/operator/AZPreference'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZWorkingMemoryPhase } from '../../src/engines/cognitive/az/core/phases/AZWorkingMemoryPhase'
import { AZWorkingMemoryChangesApplier } from '../../src/engines/cognitive/az/core/decision/AZWorkingMemoryChangesApplier'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'

const calls: string[] = []

const acceptableProcessor = {
  processAll(): void {
    calls.push('acceptable')
  },
} as unknown as AZAcceptablePreferenceWmeChangesProcessor

const synchronizer = {} as AZAcceptablePreferenceWmeSynchronizer

const nonContextSlotsDecider = {
  decideAll(): void {
    calls.push('non-context')
  },
} as unknown as AZNonContextSlotsDecider

const changesApplier = {
  apply(): void {
    calls.push('apply')
  },
} as unknown as AZWorkingMemoryChangesApplier

const phase =
  new AZWorkingMemoryPhase(
    new AZPreferenceMemory(),
    new AZWorkingMemory(),
    acceptableProcessor,
    synchronizer,
    nonContextSlotsDecider,
    changesApplier,
  )

phase.execute(new AZMatchSet())

assert.deepEqual(
  calls,
  [
    'acceptable',
    'non-context',
    'apply',
  ],
  'AZ working-memory phase must preserve acceptable -> non-context -> apply ordering',
)

console.log(
  'AZ working-memory phase ordering: OK',
)



