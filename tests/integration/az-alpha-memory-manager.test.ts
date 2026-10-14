import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZDefaultAlphaMemoryManager } from '../../src/engines/cognitive/az/core/production/AZDefaultAlphaMemoryManager'
import { AZDefaultReteHashIndex } from '../../src/engines/cognitive/az/core/production/AZDefaultReteHashIndex'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols = new AZSymbolManager()
const workingMemory = new AZWorkingMemory()
const hashIndex = new AZDefaultReteHashIndex()

const manager =
  new AZDefaultAlphaMemoryManager(
    workingMemory,
    hashIndex,
  )

const state = symbols.makeIdentifier('S')
const attribute =
  symbols.makeStringConstant('name')
const value =
  symbols.makeStringConstant('Rabat')

const existingWme =
  workingMemory.createElement(
    state,
    attribute,
    value,
  )

workingMemory.scheduleAdd(existingWme)
workingMemory.applyBufferedChanges()

const alpha =
  manager.findOrCreate(
    null,
    attribute,
    value,
    false,
  )

assert.equal(
  manager.getAlphaMemories().length,
  1,
)

assert.equal(
  alpha.referenceCount,
  1,
)

assert.equal(
  alpha.getRightMemories().length,
  1,
)

assert.equal(
  alpha.getRightMemories()[0]
    ?.workingMemoryElement,
  existingWme,
)

const expectedHash =
  alpha.id ^ state.hashId

assert.equal(
  hashIndex
    .getRightBucket(expectedHash)
    .some(
      (rightMemory) =>
        rightMemory.workingMemoryElement ===
        existingWme,
    ),
  true,
)

const reused =
  manager.findOrCreate(
    null,
    attribute,
    value,
    false,
  )

assert.equal(reused, alpha)
assert.equal(alpha.referenceCount, 2)

const secondState =
  symbols.makeIdentifier('S')

const secondWme =
  workingMemory.createElement(
    secondState,
    attribute,
    value,
  )

workingMemory.scheduleAdd(secondWme)
workingMemory.applyBufferedChanges()

const matched =
  manager.addWorkingMemoryElement(
    secondWme,
  )

assert.deepEqual(matched, [alpha])

assert.equal(
  alpha.getRightMemories().some(
    (rightMemory) =>
      rightMemory.workingMemoryElement ===
      secondWme,
  ),
  true,
)

const duplicateAdd =
  manager.addWorkingMemoryElement(
    secondWme,
  )

assert.deepEqual(duplicateAdd, [])

const affected =
  manager.removeWorkingMemoryElement(
    existingWme,
  )

assert.deepEqual(affected, [alpha])

assert.equal(
  alpha.getRightMemories().some(
    (rightMemory) =>
      rightMemory.workingMemoryElement ===
      existingWme,
  ),
  false,
)

manager.removeReference(alpha)

assert.equal(alpha.referenceCount, 1)
assert.equal(
  manager.getAlphaMemories().length,
  1,
)

manager.removeReference(alpha)

assert.equal(alpha.referenceCount, 0)
assert.equal(
  manager.getAlphaMemories().length,
  0,
)

assert.equal(
  alpha.getRightMemories().length,
  0,
)

assert.equal(
  hashIndex.getRightBucket(expectedHash).some(
    (rightMemory) =>
      rightMemory.workingMemoryElement ===
      existingWme,
  ),
  false,
)

/*
 * A newly-created specific alpha memory must be
 * populated from an existing more-general alpha memory.
 */
const generalAlpha =
  manager.findOrCreate(
    null,
    attribute,
    null,
    false,
  )

const specificAlpha =
  manager.findOrCreate(
    secondState,
    attribute,
    value,
    false,
  )

assert.equal(
  generalAlpha.getRightMemories().some(
    (rightMemory) =>
      rightMemory.workingMemoryElement ===
      secondWme,
  ),
  true,
)

assert.equal(
  specificAlpha.getRightMemories().length,
  1,
)

assert.equal(
  specificAlpha.getRightMemories()[0]
    ?.workingMemoryElement,
  secondWme,
)
console.log(
  'AZ autonomous alpha-memory manager lifecycle: OK',
)


