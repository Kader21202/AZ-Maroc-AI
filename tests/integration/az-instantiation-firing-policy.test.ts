import assert from 'node:assert/strict'

import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultInstantiationFiringPolicy } from '../../src/engines/cognitive/az/core/production/AZInstantiationFiringPolicy'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbols = new AZSymbolManager()
const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const policy =
  new AZDefaultInstantiationFiringPolicy(
    identifierStates,
  )

const currentIdentifier =
  symbols.makeIdentifier('S')

const parentIdentifier =
  symbols.makeIdentifier('P')

identifierStates.register(
  currentIdentifier,
  {
    level: 3,
    promotionLevel: 3,
  },
)

identifierStates.register(
  parentIdentifier,
  {
    level: 2,
    promotionLevel: 2,
  },
)

const attribute =
  symbols.makeStringConstant('value')

const value =
  symbols.makeIntegerConstant(5)

const currentWme = {
  timetag: 1,
  identifier: currentIdentifier,
  attribute,
  value,
  acceptable: false,
}

const parentWme = {
  timetag: 2,
  identifier: parentIdentifier,
  attribute,
  value,
  acceptable: false,
}

const parentToken: AZToken = {
  parent: null,
  workingMemoryElement: parentWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const token: AZToken = {
  parent: parentToken,
  workingMemoryElement: currentWme,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

const production = (
  name: string,
  actions: AZProduction['actions'],
): AZProduction => ({
  name,
  declaredSupport: 'I_SUPPORT',
  conditions: [],
  actions,
  instantiations: [],
  productionNode: null,
})

/*
 * 1. Highest active level:
 * firing is immediate regardless of changeLevel.
 */
assert.equal(
  policy.shouldCreate(
    production('immediate', []),
    token,
    currentWme,
    {
      activeLevel: 3,
      highestActiveLevel: 3,
      changeLevel: 2,
    },
  ),
  true,
)

/*
 * 2. Direct identifier at changeLevel:
 * firing must be postponed.
 */
assert.equal(
  policy.shouldCreate(
    production('blocked', [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: parentIdentifier,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: attribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: value,
        },
        support: 'UNKNOWN',
      },
    ]),
    token,
    currentWme,
    {
      activeLevel: 3,
      highestActiveLevel: 2,
      changeLevel: 2,
    },
  ),
  false,
)

/*
 * 3. Identifier deeper than changeLevel:
 * firing is allowed.
 */
assert.equal(
  policy.shouldCreate(
    production('allowed', [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'SYMBOL',
          symbol: currentIdentifier,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: attribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: value,
        },
        support: 'UNKNOWN',
      },
    ]),
    token,
    currentWme,
    {
      activeLevel: 3,
      highestActiveLevel: 2,
      changeLevel: 2,
    },
  ),
  true,
)

/*
 * 4a. UNBOUND_VARIABLE identifiers do not
 * participate in waterfall blocking.
 */
assert.equal(
  policy.shouldCreate(
    production('unbound', [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'UNBOUND_VARIABLE',
          index: 0,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: attribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: value,
        },
        support: 'UNKNOWN',
      },
    ]),
    token,
    currentWme,
    {
      activeLevel: 3,
      highestActiveLevel: 2,
      changeLevel: 2,
    },
  ),
  true,
)

/*
 * 4b. FUNCALL actions do not participate
 * in waterfall blocking.
 */
assert.equal(
  policy.shouldCreate(
    production('funcall', [
      {
        type: 'FUNCALL',
        functionCall: {
          type: 'FUNCALL',
          functionName:
            symbols.makeStringConstant('test-fn'),
          arguments: [],
        },
      },
    ]),
    token,
    currentWme,
    {
      activeLevel: 3,
      highestActiveLevel: 2,
      changeLevel: 2,
    },
  ),
  true,
)

/*
 * 5. RETE_LOCATION resolves through the
 * parent token to the level-2 identifier,
 * therefore firing is blocked.
 */
assert.equal(
  policy.shouldCreate(
    production('rete-location', [
      {
        type: 'MAKE',
        preferenceType: 'ACCEPTABLE',
        identifier: {
          type: 'RETE_LOCATION',
          fieldNumber: 0,
          levelsUp: 1,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: attribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: value,
        },
        support: 'UNKNOWN',
      },
    ]),
    parentToken,
    currentWme,
    {
      activeLevel: 3,
      highestActiveLevel: 2,
      changeLevel: 2,
    },
  ),
  false,
)

console.log(
  'AZ instantiation firing policy: OK',
)

