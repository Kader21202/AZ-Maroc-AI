import assert from 'node:assert/strict'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import type { AZWorkingMemoryElement } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbols =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const added:
  AZWorkingMemoryElement[] = []

const removed:
  AZWorkingMemoryElement[] = []

workingMemory.setPropagation({
  onAdded(element) {
    added.push(element)
  },

  onRemoved(element) {
    removed.push(element)
  },
})

const state =
  symbols.makeIdentifier('S')

const attribute =
  symbols.makeStringConstant('status')

const value =
  symbols.makeStringConstant('ready')

const first =
  workingMemory.createElement(
    state,
    attribute,
    value,
  )

assert.equal(first.timetag, 1)
assert.equal(
  workingMemory.getElements().length,
  0,
)

workingMemory.scheduleAdd(first)

assert.equal(
  workingMemory.getElements().length,
  0,
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().length,
  1,
)

assert.equal(
  workingMemory.getElements()[0],
  first,
)

assert.deepEqual(
  added,
  [first],
)

const second =
  workingMemory.createElement(
    state,
    attribute,
    symbols.makeStringConstant('done'),
    true,
  )

assert.equal(second.timetag, 2)
assert.equal(second.acceptable, true)

workingMemory.scheduleAdd(second)
workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().length,
  2,
)

workingMemory.scheduleRemove(first)

assert.equal(
  workingMemory.getElements().length,
  2,
)

workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().length,
  1,
)

assert.equal(
  workingMemory.getElements()[0],
  second,
)

assert.deepEqual(
  removed,
  [first],
)

workingMemory.setPropagation(null)

workingMemory.scheduleRemove(second)
workingMemory.applyBufferedChanges()

assert.equal(
  workingMemory.getElements().length,
  0,
)

assert.deepEqual(
  removed,
  [first],
)

console.log(
  'AZ autonomous working memory lifecycle: OK',
)
