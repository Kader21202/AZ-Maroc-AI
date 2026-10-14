import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZGoalStateResolver } from '../../src/engines/cognitive/az/core/production/AZGoalStateResolver'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import { AZProductionRuntimeAssembly } from '../../src/engines/cognitive/az/core/production/AZProductionRuntimeAssembly'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)
const workingMemory = new AZWorkingMemory()

const s1 = symbols.makeIdentifier('S')
const i2 = symbols.makeIdentifier('I')

const goalStateResolver: AZGoalStateResolver = {
  isGoal(candidate): boolean {
    return candidate === s1
  },
  getLevel(candidate): number {
    if (candidate === s1) return 1
    throw new Error('Symbol is not a test goal')
  },
}

const runtime =
  new AZProductionRuntimeAssembly(
    workingMemory,
    goalStateResolver,
    predefined.operator,
  )

const s = symbols.makeVariable('<s>')
const op = symbols.makeVariable('<op>')
const name = symbols.makeStringConstant('name')
const initialize =
  symbols.makeStringConstant('initialize-count-and-die')
const init = symbols.makeStringConstant('init')

function makeApplyProduction(
  productionName: string,
  operatorName: ReturnType<typeof symbols.makeStringConstant>,
): AZProduction {
  return {
    name: productionName,
    declaredSupport: 'O_SUPPORT',
    conditions: [
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'CONJUNCTIVE',
          conjuncts: [
            { type: 'EQUALITY', referent: s },
            { type: 'GOAL_ID' },
          ],
        },
        attributeTest: {
          type: 'EQUALITY',
          referent: predefined.operator,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: op,
        },
        acceptable: false,
      },
      {
        type: 'POSITIVE',
        identifierTest: {
          type: 'EQUALITY',
          referent: op,
        },
        attributeTest: {
          type: 'EQUALITY',
          referent: name,
        },
        valueTest: {
          type: 'EQUALITY',
          referent: operatorName,
        },
        acceptable: false,
      },
    ],
    actions: [],
    instantiations: [],
  }
}

const initializeProduction =
  makeApplyProduction(
    'apply*initialize-shared-prefix',
    initialize,
  )

const initProduction =
  makeApplyProduction(
    'apply*init-shared-prefix',
    init,
  )

assert.equal(
  runtime.productionInstaller.install(initializeProduction),
  'NO_REFRACTED_INSTANTIATION',
)

assert.equal(
  runtime.productionInstaller.install(initProduction),
  'NO_REFRACTED_INSTANTIATION',
)

const selectedOperator =
  workingMemory.createElement(
    s1,
    predefined.operator,
    i2,
    false,
  )

const operatorName =
  workingMemory.createElement(
    i2,
    name,
    initialize,
    false,
  )

workingMemory.scheduleAdd(selectedOperator)
workingMemory.scheduleAdd(operatorName)
workingMemory.applyBufferedChanges()

assert.equal(
  runtime.matchSet.hasAssertion('O_ASSERTION', s1),
  true,
  'initialize branch must initially match',
)

const installedInit =
  runtime.proceduralMemory.findByName(
    'apply*init-shared-prefix',
  )

assert.notEqual(installedInit, undefined)

let secondPositive: any =
  installedInit!.productionNode?.parent ?? null

assert.equal(
  secondPositive?.type,
  'POSITIVE',
  'init production must end in its second positive node',
)

assert.equal(
  secondPositive.leftUnlinked,
  true,
  'init branch must already be left-unlinked while its alpha memory is empty',
)

assert.equal(
  secondPositive.rightUnlinked,
  false,
  'before shared parent memory disappears, init branch must remain right-linked',
)

workingMemory.scheduleRemove(selectedOperator)
workingMemory.scheduleRemove(operatorName)
workingMemory.applyBufferedChanges()

assert.equal(
  secondPositive.leftUnlinked === true &&
    secondPositive.rightUnlinked === true,
  false,
  'AZ invariant violated: removing the last shared-prefix token must not leave the positive node simultaneously left- and right-unlinked',
)

console.log(
  'AZ RETE shared-prefix double-unlink invariant: OK',
)
