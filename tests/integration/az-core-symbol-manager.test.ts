import assert from 'node:assert/strict'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()

const variable1 = symbols.makeVariable('s')
const variable2 = symbols.makeVariable('s')
assert.equal(variable1, variable2)
assert.equal(variable1.type, 'VARIABLE')
assert.equal(variable1.value, 's')

const string1 = symbols.makeStringConstant('state')
const string2 = symbols.makeStringConstant('state')
assert.equal(string1, string2)
assert.equal(string1.type, 'STRING_CONSTANT')
assert.equal(string1.value, 'state')

const integer1 = symbols.makeIntegerConstant(42)
const integer2 = symbols.makeIntegerConstant(42)
assert.equal(integer1, integer2)
assert.equal(integer1.type, 'INTEGER_CONSTANT')
assert.equal(integer1.value, 42)

const float1 = symbols.makeFloatConstant(3.5)
const float2 = symbols.makeFloatConstant(3.5)
assert.equal(float1, float2)
assert.equal(float1.type, 'FLOAT_CONSTANT')
assert.equal(float1.value, 3.5)

const identifier1 = symbols.makeIdentifier('S')
const identifier2 = symbols.makeIdentifier('S')

assert.notEqual(identifier1, identifier2)
assert.notEqual(identifier1.id, identifier2.id)
assert.notEqual(identifier1.hashId, identifier2.hashId)
assert.equal(identifier1.type, 'IDENTIFIER')
assert.equal(identifier1.value, 'S1')
assert.equal(identifier2.value, 'S2')

const allSymbols = [
  variable1,
  string1,
  integer1,
  float1,
  identifier1,
  identifier2,
]

assert.equal(
  new Set(allSymbols.map((symbol) => symbol.id)).size,
  allSymbols.length,
)

assert.equal(
  new Set(allSymbols.map((symbol) => symbol.hashId)).size,
  allSymbols.length,
)

for (let index = 1; index < allSymbols.length; index += 1) {
  assert.equal(
    allSymbols[index].hashId - allSymbols[index - 1].hashId,
    137,
    'hashId progression must remain stable',
  )
}
console.log('AZ core symbol manager: OK')

