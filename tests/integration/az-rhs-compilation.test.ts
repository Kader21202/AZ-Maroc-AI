import assert from 'node:assert/strict'
import { AZSymbolManager } from '../../src/engines/cognitive/az/core/symbols/AZSymbolManager'
import { AZDefaultVariableBindingManager } from '../../src/engines/cognitive/az/core/production/AZDefaultVariableBindingManager'
import { AZDefaultRhsValueCompiler } from '../../src/engines/cognitive/az/core/production/AZRhsValueCompiler'
import { AZDefaultProductionActionCompiler } from '../../src/engines/cognitive/az/core/production/AZProductionActionCompiler'
import type { AZRhsCompilationContext } from '../../src/engines/cognitive/az/core/production/AZRhsValueCompiler'

const symbols =
  new AZSymbolManager()

const bindings =
  new AZDefaultVariableBindingManager()

const rhsCompiler =
  new AZDefaultRhsValueCompiler(
    bindings,
  )

const actionCompiler =
  new AZDefaultProductionActionCompiler(
    rhsCompiler,
  )

const s =
  symbols.makeVariable('<s>')

const x =
  symbols.makeVariable('<x>')

const newVariable =
  symbols.makeVariable('<new>')

const attribute =
  symbols.makeStringConstant('result')

bindings.pushBinding(
  s,
  1,
  0,
)

bindings.pushBinding(
  x,
  2,
  2,
)

const context:
  AZRhsCompilationContext = {
    unboundVariableIndexes:
      new Map<string, number>(),
    nextUnboundVariableIndex: 0,
  }

const linked =
  rhsCompiler.compile(
    {
      type: 'SYMBOL',
      symbol: x,
    },
    2,
    context,
  )

assert.deepEqual(
  linked,
  {
    type: 'RETE_LOCATION',
    fieldNumber: 2,
    levelsUp: 0,
  },
)

const linkedFromHigherCondition =
  rhsCompiler.compile(
    {
      type: 'SYMBOL',
      symbol: s,
    },
    2,
    context,
  )

assert.deepEqual(
  linkedFromHigherCondition,
  {
    type: 'RETE_LOCATION',
    fieldNumber: 0,
    levelsUp: 1,
  },
)

const unboundFirst =
  rhsCompiler.compile(
    {
      type: 'SYMBOL',
      symbol: newVariable,
    },
    2,
    context,
  )

const unboundSecond =
  rhsCompiler.compile(
    {
      type: 'SYMBOL',
      symbol: newVariable,
    },
    2,
    context,
  )

assert.deepEqual(
  unboundFirst,
  {
    type: 'UNBOUND_VARIABLE',
    index: 0,
  },
)

assert.deepEqual(
  unboundSecond,
  {
    type: 'UNBOUND_VARIABLE',
    index: 0,
  },
)

assert.equal(
  context.nextUnboundVariableIndex,
  1,
)

//
// Production-action compilation:
// unary MAKE and FUNCALL must preserve
// the RHS compilation semantics.
//
const actionContext:
  AZRhsCompilationContext = {
    unboundVariableIndexes:
      new Map<string, number>(),
    nextUnboundVariableIndex: 0,
  }

const compiledUnary =
  actionCompiler.compile(
    {
      type: 'MAKE',
      preferenceType: 'ACCEPTABLE',
      identifier: {
        type: 'SYMBOL',
        symbol: s,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: attribute,
      },
      value: {
        type: 'SYMBOL',
        symbol: x,
      },
      support: 'UNKNOWN',
    },
    2,
    actionContext,
  )

assert.deepEqual(
  compiledUnary,
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
      type: 'RETE_LOCATION',
      fieldNumber: 2,
      levelsUp: 0,
    },
    support: 'UNKNOWN',
  },
)

const actionUnbound =
  symbols.makeVariable(
    '<action-unbound>',
  )

const functionName =
  symbols.makeStringConstant('write')

const compiledFuncall =
  actionCompiler.compile(
    {
      type: 'FUNCALL',
      functionCall: {
        type: 'FUNCALL',
        functionName,
        arguments: [
          {
            type: 'SYMBOL',
            symbol: actionUnbound,
          },
        ],
      },
    },
    2,
    actionContext,
  )

assert.deepEqual(
  compiledFuncall,
  {
    type: 'FUNCALL',
    functionCall: {
      type: 'FUNCALL',
      functionName,
      arguments: [
        {
          type: 'UNBOUND_VARIABLE',
          index: 0,
        },
      ],
    },
  },
)

assert.equal(
  actionContext.nextUnboundVariableIndex,
  1,
)
const binaryValue =
  symbols.makeVariable('<binary-value>')

const binaryIdentifier =
  symbols.makeVariable('<binary-id>')

const binaryAttribute =
  symbols.makeVariable('<binary-attr>')

const binaryReferent =
  symbols.makeVariable('<binary-ref>')

const binaryContext:
  AZRhsCompilationContext = {
    unboundVariableIndexes:
      new Map<string, number>(),
    nextUnboundVariableIndex: 0,
  }

const compiledBinary =
  actionCompiler.compile(
    {
      type: 'MAKE',
      preferenceType: 'BETTER',
      identifier: {
        type: 'SYMBOL',
        symbol: binaryIdentifier,
      },
      attribute: {
        type: 'SYMBOL',
        symbol: binaryAttribute,
      },
      value: {
        type: 'SYMBOL',
        symbol: binaryValue,
      },
      referent: {
        type: 'SYMBOL',
        symbol: binaryReferent,
      },
      support: 'UNKNOWN',
    },
    2,
    binaryContext,
  )

if (compiledBinary.type !== 'MAKE') {
  throw new Error(
    'Expected compiled MAKE action',
  )
}

assert.deepEqual(
  compiledBinary.value,
  {
    type: 'UNBOUND_VARIABLE',
    index: 0,
  },
)

assert.deepEqual(
  compiledBinary.identifier,
  {
    type: 'UNBOUND_VARIABLE',
    index: 1,
  },
)

assert.deepEqual(
  compiledBinary.attribute,
  {
    type: 'UNBOUND_VARIABLE',
    index: 2,
  },
)

assert.deepEqual(
  compiledBinary.referent,
  {
    type: 'UNBOUND_VARIABLE',
    index: 3,
  },
)

assert.throws(
  () =>
    actionCompiler.compile(
      {
        type: 'MAKE',
        preferenceType: 'BETTER',
        identifier: {
          type: 'SYMBOL',
          symbol: s,
        },
        attribute: {
          type: 'SYMBOL',
          symbol: attribute,
        },
        value: {
          type: 'SYMBOL',
          symbol: x,
        },
        support: 'UNKNOWN',
      },
      2,
      {
        unboundVariableIndexes:
          new Map(),
        nextUnboundVariableIndex: 0,
      },
    ),
  /requires a referent/,
)

bindings.popBinding(x)
bindings.popBinding(s)

console.log(
  'AZ RHS and production action compilation: OK',
)

