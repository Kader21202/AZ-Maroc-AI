import assert from 'node:assert/strict'
import { AZWmeCausalProvenanceRegistry } from '../../src/engines/cognitive/az/core/AZWmeCausalProvenanceRegistry'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'

const symbolManager =
  new AZSymbolManager()

const workingMemory =
  new AZWorkingMemory()

const identifier =
  symbolManager.makeIdentifier(
    'S',
  )

const attribute =
  symbolManager.makeStringConstant(
    'stage',
  )

const value =
  symbolManager.makeStringConstant(
    'analyzed',
  )

const wme =
  workingMemory.createElement(
    identifier,
    attribute,
    value,
    false,
  )

const producerA = {
  id: 1,
} as AZInstantiation

const producerB = {
  id: 2,
} as AZInstantiation

const registry =
  new AZWmeCausalProvenanceRegistry()

assert.equal(
  registry.resolve(wme),
  null,
)

registry.capture(
  wme,
  producerA,
)

assert.equal(
  registry.resolve(wme),
  producerA,
)

registry.capture(
  wme,
  producerB,
)

assert.equal(
  registry.resolve(wme),
  producerA,
)

console.log(
  'AZ WME causal provenance registry: OK',
)


