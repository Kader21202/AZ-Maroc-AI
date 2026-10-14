import { strict as assert } from 'node:assert'

import {
  AZDefaultGoalStructuralStateRegistry,
} from '../../src/engines/cognitive/az/core/state/AZGoalStructuralStateRegistry'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbolManager =
  new AZSymbolManager()

const predefinedSymbols =
  new AZPredefinedSymbols(
    symbolManager,
  )

assert.equal(
  predefinedSymbols.type.value,
  'type',
)

assert.equal(
  predefinedSymbols.state.value,
  'state',
)

assert.equal(
  predefinedSymbols.superstate.value,
  'superstate',
)

assert.equal(
  predefinedSymbols.attribute.value,
  'attribute',
)

assert.equal(
  predefinedSymbols.impasse.value,
  'impasse',
)

assert.equal(
  predefinedSymbols.choices.value,
  'choices',
)

assert.equal(
  predefinedSymbols.quiescence.value,
  'quiescence',
)

assert.equal(
  predefinedSymbols.item.value,
  'item',
)

assert.equal(
  predefinedSymbols.itemCount.value,
  'item-count',
)

assert.equal(
  predefinedSymbols.nonNumeric.value,
  'non-numeric',
)

assert.equal(
  predefinedSymbols.nonNumericCount.value,
  'non-numeric-count',
)

assert.equal(
  predefinedSymbols.multiple.value,
  'multiple',
)

assert.equal(
  predefinedSymbols.t.value,
  't',
)

const goal =
  symbolManager.makeIdentifier('S')

const registry =
  new AZDefaultGoalStructuralStateRegistry()

assert.equal(
  registry.has(goal),
  false,
)

const structuralState =
  registry.register(goal)

assert.equal(
  registry.has(goal),
  true,
)

assert.equal(
  structuralState.operatorSlot,
  null,
)

assert.equal(
  structuralState.impasseType,
  'NONE',
)

assert.equal(
  structuralState.impasseAttribute,
  null,
)

assert.equal(
  structuralState.impasseWmes.length,
  0,
)

assert.equal(
  registry.get(goal),
  structuralState,
)

registry.remove(goal)

assert.equal(
  registry.has(goal),
  false,
)

assert.throws(
  () => registry.get(goal),
  /Goal structural state is not registered/,
)

console.log(
  'AZ goal structural state foundation: OK',
)
