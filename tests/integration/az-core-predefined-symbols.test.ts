import assert from 'node:assert/strict'
import { AZPredefinedSymbols } from '../../src/engines/cognitive/az/core/symbols/AZPredefinedSymbols'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const predefined = new AZPredefinedSymbols(symbols)

assert.equal(predefined.io.type, 'STRING_CONSTANT')
assert.equal(predefined.io.value, 'io')

assert.equal(predefined.inputLink.type, 'STRING_CONSTANT')
assert.equal(predefined.inputLink.value, 'input-link')

assert.equal(predefined.operator.type, 'STRING_CONSTANT')
assert.equal(predefined.operator.value, 'operator')

assert.equal(
  predefined.io,
  symbols.makeStringConstant('io'),
)

assert.equal(
  predefined.inputLink,
  symbols.makeStringConstant('input-link'),
)

assert.equal(
  predefined.operator,
  symbols.makeStringConstant('operator'),
)

console.log('AZ core predefined symbols: OK')
