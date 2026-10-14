import assert from 'node:assert/strict'

import { AZDefaultTransitiveClosureNumberGenerator } from '../../src/engines/cognitive/az/core/decision/AZTransitiveClosureNumberGenerator'
import { AZInputWmeRegistry } from '../../src/engines/cognitive/az/core/io/AZInputWmeRegistry'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const tc =
  new AZDefaultTransitiveClosureNumberGenerator()

assert.equal(tc.next(), 1)
assert.equal(tc.next(), 2)
assert.equal(tc.next(), 3)

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const registry =
  new AZInputWmeRegistry()

const identifier =
  symbols.makeIdentifier('I')

const attributeA =
  symbols.makeStringConstant('a')

const attributeB =
  symbols.makeStringConstant('b')

const valueA =
  symbols.makeStringConstant('A')

const valueB =
  symbols.makeStringConstant('B')

const first =
  workingMemory.createElement(
    identifier,
    attributeA,
    valueA,
    false,
  )

const second =
  workingMemory.createElement(
    identifier,
    attributeB,
    valueB,
    false,
  )

assert.deepEqual(
  registry.get(identifier),
  [],
)

registry.add(identifier, first)
registry.add(identifier, second)

assert.deepEqual(
  registry.get(identifier),
  [second, first],
)

assert.equal(
  registry.remove(identifier, second),
  true,
)

assert.deepEqual(
  registry.get(identifier),
  [first],
)

assert.equal(
  registry.remove(identifier, second),
  false,
)

assert.equal(
  registry.remove(identifier, first),
  true,
)

assert.deepEqual(
  registry.get(identifier),
  [],
)

console.log(
  'AZ identifier auxiliary state: OK',
)
