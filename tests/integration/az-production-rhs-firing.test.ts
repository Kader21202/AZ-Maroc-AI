import assert from 'node:assert/strict'

import { AZDefaultIdentifierLinkStateRegistry } from '../../src/engines/cognitive/az/core/state/AZDefaultIdentifierLinkStateRegistry'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import type { AZInstantiation } from '../../src/engines/cognitive/az/core/production/AZInstantiation'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionAction } from '../../src/engines/cognitive/az/core/production/AZProductionAction'
import { AZProductionActionExecutor } from '../../src/engines/cognitive/az/core/production/AZProductionActionExecutor'
import { AZRhsFunctionRegistry } from '../../src/engines/cognitive/az/core/production/AZRhsFunctionRegistry'
import { AZRhsValueInstantiator } from '../../src/engines/cognitive/az/core/production/AZRhsValueInstantiator'
import type { AZToken } from '../../src/engines/cognitive/az/core/production/AZToken'

const symbols = new AZSymbolManager()
const identifierStates =
  new AZDefaultIdentifierLinkStateRegistry()

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

//
// 1. UNBOUND_VARIABLE:
//    same binding inside one firing context,
//    level stored outside AZSymbol.
//
const rhsFunctions =
  new AZRhsFunctionRegistry()

const rhsInstantiator =
  new AZRhsValueInstantiator(
    symbols,
    identifierStates,
    rhsFunctions,
  )

const bindingContext = {
  unboundVariableBindings:
    new Map(),
}

const first =
  rhsInstantiator.instantiate(
    {
      type: 'UNBOUND_VARIABLE',
      index: 7,
    },
    token,
    null,
    4,
    bindingContext,
  )

const second =
  rhsInstantiator.instantiate(
    {
      type: 'UNBOUND_VARIABLE',
      index: 7,
    },
    token,
    null,
    99,
    bindingContext,
  )

assert.ok(first !== null)
assert.equal(first.type, 'IDENTIFIER')
assert.equal(second, first)

assert.equal(
  identifierStates.get(first).level,
  4,
)

assert.equal(
  identifierStates.get(first)
    .promotionLevel,
  4,
)

assert.equal(
  'level' in first,
  false,
)

//
// 2. FUNCALL:
//    registry lookup, arity and execution.
//
const functionName =
  symbols.makeStringConstant(
    'az-test-function',
  )

const functionResult =
  symbols.makeStringConstant(
    'function-result',
  )

let functionCalls = 0

rhsFunctions.register(
  functionName,
  {
    canBeRhsValue: true,
    canBeStandaloneAction: true,
    numArgsExpected: 1,

    execute(arguments_) {
      functionCalls += 1

      assert.equal(
        arguments_[0]?.value,
        'argument',
      )

      return functionResult
    },
  },
)

const functionValue =
  rhsInstantiator.instantiate(
    {
      type: 'FUNCALL',
      functionName,
      arguments: [
        {
          type: 'SYMBOL',
          symbol:
            symbols.makeStringConstant(
              'argument',
            ),
        },
      ],
    },
    token,
    null,
    0,
    {
      unboundVariableBindings:
        new Map(),
    },
  )

assert.equal(
  functionValue,
  functionResult,
)

assert.equal(functionCalls, 1)

const wrongArity =
  rhsInstantiator.instantiate(
    {
      type: 'FUNCALL',
      functionName,
      arguments: [],
    },
    token,
    null,
    0,
    {
      unboundVariableBindings:
        new Map(),
    },
  )

assert.equal(wrongArity, null)
assert.equal(functionCalls, 1)

const unknownFunction =
  rhsInstantiator.instantiate(
    {
      type: 'FUNCALL',
      functionName:
        symbols.makeStringConstant(
          'az-unknown-function',
        ),
      arguments: [],
    },
    token,
    null,
    0,
    {
      unboundVariableBindings:
        new Map(),
    },
  )

assert.equal(unknownFunction, null)
assert.equal(functionCalls, 1)
//
// 3. MAKE action:
//    external identifier level,
//    binary preference,
//    O-support from assertion type.
//
const goal =
  symbols.makeIdentifier('S')

identifierStates.register(
  goal,
  {
    level: 3,
    promotionLevel: 3,
  },
)

const production: AZProduction = {
  name: 'az-rhs-test',
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

const instantiation:
  AZInstantiation = {
    id: 1,
    production,
    instantiatedConditions: [],
    matchGoal: goal,
    matchGoalLevel: 3,
    inMatchSet: true,
    generatedPreferences: [],
    reteToken: token,
    reteWme: null,
  }

const attribute =
  symbols.makeStringConstant(
    'choice',
  )

const value =
  symbols.makeStringConstant(
    'alpha',
  )

const referent =
  symbols.makeStringConstant(
    'beta',
  )

const action: AZProductionAction = {
  type: 'MAKE',
  preferenceType: 'BETTER',
  identifier: {
    type: 'SYMBOL',
    symbol: goal,
  },
  attribute: {
    type: 'SYMBOL',
    symbol: attribute,
  },
  value: {
    type: 'SYMBOL',
    symbol: value,
  },
  referent: {
    type: 'SYMBOL',
    symbol: referent,
  },
  support: 'UNKNOWN',
}

const actionExecutor =
  new AZProductionActionExecutor(
    symbols,
    identifierStates,
    rhsFunctions,
  )

const preference =
  actionExecutor.execute(
    action,
    token,
    null,
    instantiation,
    {
      unboundVariableBindings:
        new Map(),
      assertionType: 'O_ASSERTION',
    },
  )

assert.ok(preference !== null)

assert.equal(
  preference.identifier,
  goal,
)

assert.equal(
  preference.attribute,
  attribute,
)

assert.equal(
  preference.value,
  value,
)

assert.equal(
  preference.referent,
  referent,
)

assert.equal(
  preference.level,
  3,
)

assert.equal(
  preference.oSupported,
  true,
)

assert.equal(
  instantiation
    .generatedPreferences.length,
  1,
)

assert.equal(
  instantiation
    .generatedPreferences[0],
  preference,
)


//
// 4. SYMBOL identifier lifecycle:
//    an unregistered RHS identifier is
//    materialized at the supplied level,
//    while an existing state is preserved.
//
const literalIdentifier =
  symbols.makeIdentifier('O')

const materializedLiteral =
  rhsInstantiator.instantiate(
    {
      type: 'SYMBOL',
      symbol: literalIdentifier,
    },
    token,
    null,
    5,
    {
      unboundVariableBindings:
        new Map(),
    },
  )

assert.equal(
  materializedLiteral,
  literalIdentifier,
)

assert.equal(
  identifierStates
    .get(literalIdentifier)
    .level,
  5,
)

assert.equal(
  identifierStates
    .get(literalIdentifier)
    .promotionLevel,
  5,
)

const existingIdentifier =
  symbols.makeIdentifier('O')

identifierStates.register(
  existingIdentifier,
  {
    level: 2,
    promotionLevel: 2,
  },
)

rhsInstantiator.instantiate(
  {
    type: 'SYMBOL',
    symbol: existingIdentifier,
  },
  token,
  null,
  8,
  {
    unboundVariableBindings:
      new Map(),
  },
)

assert.equal(
  identifierStates
    .get(existingIdentifier)
    .level,
  2,
)

assert.equal(
  identifierStates
    .get(existingIdentifier)
    .promotionLevel,
  2,
)

//
// 5. Explicit I-support overrides
//    assertion type.
//
const iProduction: AZProduction = {
  ...production,
  name: 'az-rhs-i-support-test',
  declaredSupport: 'I_SUPPORT',
  instantiations: [],
}

const iInstantiation:
  AZInstantiation = {
    ...instantiation,
    id: 2,
    production: iProduction,
    generatedPreferences: [],
  }

const iPreference =
  actionExecutor.execute(
    {
      ...action,
      preferenceType: 'ACCEPTABLE',
      referent: undefined,
    },
    token,
    null,
    iInstantiation,
    {
      unboundVariableBindings:
        new Map(),
      assertionType: 'O_ASSERTION',
    },
  )

assert.ok(iPreference !== null)
assert.equal(
  iPreference.oSupported,
  false,
)

//
// 6. Production-action executor residues:
//    shared UNBOUND binding, invalid RHS
//    identifier and architectural guard.
//
const sharedUnboundPreference =
  actionExecutor.execute(
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: goal,
      },
      attribute: {
        type: 'UNBOUND_VARIABLE',
        index: 0,
      },
      value: {
        type: 'UNBOUND_VARIABLE',
        index: 0,
      },
      support: 'UNKNOWN',
    },
    token,
    null,
    instantiation,
    {
      unboundVariableBindings:
        new Map(),
      assertionType: 'O_ASSERTION',
    },
  )

assert.ok(sharedUnboundPreference !== null)
assert.equal(
  sharedUnboundPreference.attribute,
  sharedUnboundPreference.value,
)

const invalidIdentifierPreference =
  actionExecutor.execute(
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol:
          symbols.makeStringConstant(
            'not-an-id',
          ),
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
    token,
    null,
    instantiation,
    {
      unboundVariableBindings:
        new Map(),
      assertionType: 'O_ASSERTION',
    },
  )

assert.equal(
  invalidIdentifierPreference,
  null,
)

const architecturalInstantiation:
  AZInstantiation = {
    ...instantiation,
    id: 3,
    production: null,
    generatedPreferences: [],
  }

assert.throws(
  () =>
    actionExecutor.execute(
      {
        ...action,
        preferenceType: 'ACCEPTABLE',
        referent: undefined,
      },
      token,
      null,
      architecturalInstantiation,
      {
        unboundVariableBindings:
          new Map(),
        assertionType: 'I_ASSERTION',
      },
    ),
  /Architectural instantiation cannot execute production actions/,
)
console.log(
  'AZ autonomous RHS firing semantics: OK',
)



