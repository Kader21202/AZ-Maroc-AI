import assert from 'node:assert/strict'

import { AZDefaultCognitiveRunControl } from '../../src/engines/cognitive/az/core/cycle/AZDefaultCognitiveRunControl'
import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZHaltRhsFunction } from '../../src/engines/cognitive/az/core/production/AZHaltRhsFunction'
import { AZRhsFunctionRegistry } from '../../src/engines/cognitive/az/core/production/AZRhsFunctionRegistry'
import { AZRhsValueInstantiator } from '../../src/engines/cognitive/az/core/production/AZRhsValueInstantiator'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbols = new AZSymbolManager()
const identifierStates = new AZDefaultIdentifierLinkStateRegistry()
const runControl = new AZDefaultCognitiveRunControl()
const rhsFunctions = new AZRhsFunctionRegistry()

const haltName = symbols.makeStringConstant('halt')
rhsFunctions.register(
  haltName,
  new AZHaltRhsFunction(runControl),
)

const rhsInstantiator = new AZRhsValueInstantiator(
  symbols,
  identifierStates,
  rhsFunctions,
)

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const context = {
  unboundVariableBindings: new Map(),
}

rhsInstantiator.instantiate(
  {
    type: 'FUNCALL',
    functionName: haltName,
    arguments: [],
  },
  token,
  null,
  1,
  context,
  'STANDALONE',
)

assert.equal(
  runControl.isHalted(),
  true,
  'AZ (halt) with zero arguments must halt AZ run control',
)

console.log(
  'AZ halt zero-argument semantics: OK',
)
