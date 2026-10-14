import assert from 'node:assert/strict'
import { AZElaborationRuntimeAssembly } from '../../src/engines/cognitive/az/core/cycle/AZElaborationRuntimeAssembly'
import { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import type { AZNonContextSlotsDecider } from '../../src/engines/cognitive/az/core/decision/AZNonContextSlotDecider'
import type { AZIdentifierDemotionProcessor } from '../../src/engines/cognitive/az/core/decision/AZIdentifierDemotionProcessor'
import type { AZIdentifierPromotionBufferProcessor } from '../../src/engines/cognitive/az/core/decision/AZIdentifierPromotionBufferProcessor'
import type { AZLinkAdditionProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkAdditionProcessor'
import type { AZLinkRemovalProcessor } from '../../src/engines/cognitive/az/core/decision/AZLinkRemovalProcessor'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZAcceptablePreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/memory/AZAcceptablePreferenceWmeRegistry'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const preferenceMemory =
  new AZPreferenceMemory()

const workingMemory =
  new AZWorkingMemory()

const matchSet =
  new AZMatchSet()

let nonContextSlotPasses = 0

const nonContextSlotsDecider = {
  decideAll(): void {
    nonContextSlotPasses += 1
  },
} as unknown as AZNonContextSlotsDecider

/*
 * Link promotion/demotion behavior already has
 * dedicated integration tests. Here these ports
 * remain deliberately inactive so this test
 * isolates composition and execution wiring.
 */
const linkAdditions = {
  post(): void {},
  hasPendingPromotions(): boolean {
    return false
  },
  takeNextPromotedIdentifier() {
    return null
  },
} as AZLinkAdditionProcessor

const linkRemovals = {
  setLinkUpdateMode(): void {},
  post(): void {},
  addUnknownLevelIdentifier(): void {},
  removeUnknownLevelIdentifier(): boolean {
    return false
  },
  getUnknownLevelIdentifiers() {
    return []
  },
  getDisconnectedIdentifiers() {
    return []
  },
  moveUnknownLevelIdentifierToDisconnected(): void {},
  takeNextUnknownLevelIdentifier() {
    return null
  },
  takeNextDisconnectedIdentifier() {
    return null
  },
} as AZLinkRemovalProcessor

const promotionProcessor = {
  processAll(): void {},
} as AZIdentifierPromotionBufferProcessor

const demotionProcessor = {
  process(): void {},
} as AZIdentifierDemotionProcessor

const bufferedLinkChangesProcessor =
  new AZBufferedLinkChangesProcessor(
    linkAdditions,
    linkRemovals,
    promotionProcessor,
    demotionProcessor,
  )

const acceptablePreferenceWmeRegistry =
  new AZAcceptablePreferenceWmeRegistry()

const assembly =
  new AZElaborationRuntimeAssembly({
    symbolManager: symbols,
    identifierStateRegistry:
      identifierStates,
    preferenceMemory,
    workingMemory,
    nonContextSlotsDecider,
    bufferedLinkChangesProcessor,
    acceptablePreferenceWmeRegistry,
  })

assert.equal(
  assembly.acceptablePreferenceWmeRegistry,
  acceptablePreferenceWmeRegistry,
  'assembly must expose the caller-owned acceptable-preference WME registry',
)

assert.ok(
  assembly.firingEngine,
  'firing engine must be assembled',
)

assert.ok(
  assembly.waterfall,
  'elaboration waterfall must be assembled',
)

assert.ok(
  assembly.workingMemoryPhase,
  'working-memory phase must be assembled',
)

assert.ok(
  assembly.elaborationCycle,
  'elaboration cycle must be assembled',
)

/*
 * Prove that the assembled working-memory phase
 * operates on the exact caller-owned memory,
 * rather than on a parallel internal instance.
 */
const identifier =
  symbols.makeIdentifier('I')

identifierStates.register(
  identifier,
  {
    level: 1,
    promotionLevel: 1,
  },
)

const attribute =
  symbols.makeStringConstant('test')

const value =
  symbols.makeStringConstant('assembled')

const wme =
  workingMemory.createElement(
    identifier,
    attribute,
    value,
  )

workingMemory.scheduleAdd(wme)

assembly.workingMemoryPhase.execute(
  matchSet,
)

assert.equal(
  workingMemory
    .getElements()
    .includes(wme),
  true,
  'assembled phase must apply changes to the shared working memory',
)

assert.equal(
  nonContextSlotPasses,
  1,
  'assembled phase must route non-context slot decision',
)

/*
 * Execute the composed elaboration cycle itself.
 * Empty match-set execution is intentional here:
 * the purpose is to prove that the assembled
 * production/waterfall/memory chain is executable.
 */
assembly.elaborationCycle.execute(
  matchSet,
  null,
  0,
  'PROPOSE',
  'IE_PRODS',
)

assert.equal(
  nonContextSlotPasses >= 2,
  true,
  'elaboration cycle must reach the assembled working-memory phase',
)

assert.equal(
  workingMemory
    .getElements()
    .includes(wme),
  true,
  'shared working memory must remain coherent after elaboration',
)

console.log(
  'AZ elaboration runtime assembly: OK',
)

