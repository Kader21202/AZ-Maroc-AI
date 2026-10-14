import assert from 'node:assert/strict'

import { AZWorkingMemory } from '../../src/engines/cognitive/az/core/memory/AZWorkingMemory'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZWorkingMemoryStructuralStateExtractor } from '../../src/engines/cognitive/az/monitoring/AZWorkingMemoryStructuralStateExtractor'
import { DefaultStructuralStateCanonicalizer } from '../../src/engines/cognitive/az/monitoring/DefaultStructuralStateCanonicalizer'

const buildState = (
  perturbSymbolIdentity: boolean,
): {
  readonly identifierId: string
  readonly canonical: string
} => {
  const symbolManager =
    new AZSymbolManager()

  if (perturbSymbolIdentity) {
    symbolManager.makeIdentifier('UNRELATED')
    symbolManager.makeStringConstant(
      'unrelated-constant',
    )
  }

  const workingMemory =
    new AZWorkingMemory()

  const identifier =
    symbolManager.makeIdentifier('S')

  const attribute =
    symbolManager.makeStringConstant(
      'status',
    )

  const value =
    symbolManager.makeStringConstant(
      'ready',
    )

  const element =
    workingMemory.createElement(
      identifier,
      attribute,
      value,
    )

  workingMemory.scheduleAdd(element)
  workingMemory.applyBufferedChanges()

  const extractor =
    new AZWorkingMemoryStructuralStateExtractor()

  const canonicalizer =
    new DefaultStructuralStateCanonicalizer()

  return {
    identifierId: identifier.id,
    canonical:
      canonicalizer.canonicalize(
        extractor.extract(
          workingMemory,
        ),
      ),
  }
}

const first =
  buildState(false)

const second =
  buildState(true)

assert.notEqual(
  first.identifierId,
  second.identifierId,
  'test precondition: independent states must use different technical symbol identities',
)

assert.equal(
  first.canonical,
  second.canonical,
  'structurally equivalent working memories must canonicalize identically despite different technical symbol identities',
)

console.log(
  'AZ working-memory structural-state extractor: OK',
)
