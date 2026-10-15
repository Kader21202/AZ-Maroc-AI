import assert from 'node:assert/strict'

import { AZWmeCausalProvenanceRegistry } from '../../src/engines/cognitive/az/core/AZWmeCausalProvenanceRegistry'
import { AZElaborationRuntimeAssembly } from '../../src/engines/cognitive/az/core/cycle/AZElaborationRuntimeAssembly'
import { AZBufferedLinkChangesProcessor } from '../../src/engines/cognitive/az/core/decision/AZBufferedLinkChangesProcessor'
import { AZNonContextSlotDecider, AZNonContextSlotsDecider } from '../../src/engines/cognitive/az/core/decision/AZNonContextSlotDecider'
import { AZNonContextPreferenceSemantics } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceSemantics'
import { AZNonContextPreferenceWmeRegistry } from '../../src/engines/cognitive/az/core/decision/AZNonContextPreferenceWmeRegistry'
import { AZPreferenceMemory } from '../../src/engines/cognitive/az/core/memory/AZPreferenceMemory'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZDefaultGoalIdentityRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultGoalIdentityRegistry'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZStateStack } from '../../src/engines/cognitive/az/core/state/AZStateStack'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZSymbol } from '../../src/engines/cognitive/az/core/symbols/AZSymbol'

function experiment(mode: 'absent' | 'disabled' | 'enabled') {
  const symbols = new AZSymbolManager()
  const predefined = new AZPredefinedSymbols(symbols)
  const memory = new AZWorkingMemory()
  const preferences = new AZPreferenceMemory()
  const goals = new AZDefaultGoalIdentityRegistry()
  const identifiers = new AZDefaultIdentifierLinkStateRegistry()
  const provenance = new AZWmeCausalProvenanceRegistry()

  const s1 = symbols.makeIdentifier('S')
  const s2 = symbols.makeIdentifier('S')
  const o1 = symbols.makeIdentifier('O')

  goals.registerGoal(s1, 1)
  goals.registerGoal(s2, 2)

  for (const [identifier, level] of [
    [s1, 1],
    [s2, 2],
    [o1, 1],
  ] as const) {
    identifiers.register(identifier, {
      level,
      promotionLevel: level,
    })
  }

  const name = symbols.makeStringConstant('name')
  const selected = symbols.makeStringConstant('selected')
  const status = symbols.makeStringConstant('status')
  const done = symbols.makeStringConstant('done')
  const phase = symbols.makeStringConstant('phase')
  const ready = symbols.makeStringConstant('ready')

  const runtime = new AZProductionRuntimeAssembly(
    memory,
    goals,
    predefined.operator,
    identifiers,
  )

  const eq = (referent: AZSymbol) => ({
    type: 'EQUALITY' as const,
    referent,
  })

  const positive = (
    identifier: AZSymbol,
    attribute: AZSymbol,
    value: AZSymbol,
  ) => ({
    type: 'POSITIVE' as const,
    identifierTest: eq(identifier),
    attributeTest: eq(attribute),
    valueTest: eq(value),
    acceptable: false,
  })

  const source: AZProduction = {
    name: `az-learn-02d-source-${mode}`,
    declaredSupport: 'O_SUPPORT',
    conditions: [
      positive(s1, predefined.operator, o1),
      positive(o1, name, selected),
      positive(s2, status, done),
    ],
    actions: [{
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: { type: 'SYMBOL', symbol: s1 },
      attribute: { type: 'SYMBOL', symbol: phase },
      value: { type: 'SYMBOL', symbol: ready },
      support: 'O_SUPPORT',
    }],
    instantiations: [],
    productionNode: null,
  }

  for (const wme of [
    memory.createElement(s1, predefined.operator, o1, false),
    memory.createElement(o1, name, selected, false),
    memory.createElement(s2, status, done, false),
  ]) {
    memory.scheduleAdd(wme)
  }

  memory.applyBufferedChanges()

  assert.equal(
    runtime.productionInstaller.install(source),
    'NO_REFRACTED_INSTANTIATION',
  )

  assert.equal(
    runtime.matchSet.hasAssertion('O_ASSERTION', s2),
    true,
  )

  const inactive = {
    post(): void {},
    hasPendingPromotions(): boolean { return false },
    takeNextPromotedIdentifier() { return null },
    setLinkUpdateMode(): void {},
    addUnknownLevelIdentifier(): void {},
    removeUnknownLevelIdentifier(): boolean { return false },
    getUnknownLevelIdentifiers() { return [] },
    getDisconnectedIdentifiers() { return [] },
    moveUnknownLevelIdentifierToDisconnected(): void {},
    takeNextUnknownLevelIdentifier() { return null },
    takeNextDisconnectedIdentifier() { return null },
  }

  const bufferedLinks = new AZBufferedLinkChangesProcessor(
    inactive,
    inactive,
    { processAll(): void {} },
    { process(): void {} },
  )

  const options = mode === 'absent'
    ? {}
    : { experientialLearningEnabled: mode === 'enabled' }

  const assembly = new AZElaborationRuntimeAssembly({
    symbolManager: symbols,
    identifierStateRegistry: identifiers,
    preferenceMemory: preferences,
    workingMemory: memory,
    nonContextSlotsDecider: new AZNonContextSlotsDecider(
      new AZNonContextSlotDecider(
        new AZNonContextPreferenceSemantics(),
        new AZNonContextPreferenceWmeRegistry(),
      ),
    ),
    bufferedLinkChangesProcessor: bufferedLinks,
    causalProvenanceRegistry: provenance,
    goalIdentityRegistry: goals,
    productionInstaller: runtime.productionInstaller,
    ...options,
  })

  const stack = new AZStateStack()
  const top = stack.setTop({}, s1)
  const active = stack.appendLower(top, {}, s2)

  const cycleResult = assembly.elaborationCycle.execute(
    runtime.matchSet,
    active,
    2,
    'APPLY',
    'PE_PRODS',
  )

  const justification =
    runtime.proceduralMemory.findByName('az-justify-1')

  const learned =
    runtime.proceduralMemory.findByName('az-learn-experience-1')

  assert.ok(
    justification,
    `${mode}: justification must be installed`,
  )

  assert.equal(
    learned !== undefined,
    mode === 'enabled',
    `${mode}: learned production presence`,
  )

  assert.ok(
    cycleResult.waterfall.createdInstantiations.length >= 2,
    `${mode}: real cycle must create source and justification instantiations`,
  )

  return {
    mode,
    learned: learned !== undefined,
    instantiations:
      cycleResult.waterfall.createdInstantiations.length,
  }
}

for (const mode of ['absent', 'disabled', 'enabled'] as const) {
  const result = experiment(mode)
  console.log(
    `AZ LEARN 02D ${result.mode}: ` +
    `${result.instantiations} instantiations, ` +
    `learned=${result.learned}`,
  )
}

console.log('AZ LEARN 02D official elaboration cycle: OK')
