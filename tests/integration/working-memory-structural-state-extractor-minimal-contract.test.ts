import { strict as assert } from 'node:assert'

import { AZWorkingMemoryStructuralStateExtractor } from '../../src/engines/cognitive/AZWorkingMemoryStructuralStateExtractor'

const workingMemory = {
  getElements: () => [
    {
      identifier: {
        id: 'S1',
        type: 'IDENTIFIER' as const,
        value: null,
      },
      attribute: {
        id: 'status',
        type: 'STRING_CONSTANT' as const,
        value: 'status',
      },
      value: {
        id: 'active',
        type: 'STRING_CONSTANT' as const,
        value: 'active',
      },
      acceptable: false,
    },
  ],
}

const extractor =
  new AZWorkingMemoryStructuralStateExtractor()

const observation =
  extractor.extract(
    workingMemory,
  )

assert.equal(
  observation.elements.length,
  1,
)

assert.deepEqual(
  observation.elements[0]?.identifier,
  {
    type: 'IDENTIFIER',
    technicalId: 'S1',
  },
)

assert.deepEqual(
  observation.elements[0]?.attribute,
  {
    type: 'STRING_CONSTANT',
    value: 'status',
  },
)

assert.deepEqual(
  observation.elements[0]?.value,
  {
    type: 'STRING_CONSTANT',
    value: 'active',
  },
)

assert.equal(
  observation.elements[0]?.acceptable,
  false,
)

console.log(
  'AZ structural-state extractor minimal working-memory contract: OK',
)
