import type { AZSymbol } from "../../src/engines/cognitive/az/core/symbols/AZSymbol"
import type { AZProductionRhsValue } from "../../src/engines/cognitive/az/core/production/AZProductionRhsValue"

const symbol: AZSymbol = {
  id: "s1",
  hashId: 1,
  type: "STRING_CONSTANT",
  value: "value",
}

const symbolValue: AZProductionRhsValue = {
  type: "SYMBOL",
  symbol,
}

const reteLocation: AZProductionRhsValue = {
  type: "RETE_LOCATION",
  fieldNumber: 2,
  levelsUp: 1,
}

const unboundVariable: AZProductionRhsValue = {
  type: "UNBOUND_VARIABLE",
  index: 3,
}

const functionCall: AZProductionRhsValue = {
  type: "FUNCALL",
  functionName: symbol,
  arguments: [
    symbolValue,
    reteLocation,
    unboundVariable,
  ],
}

if (symbolValue.type !== "SYMBOL" || symbolValue.symbol !== symbol) {
  throw new Error("AZProductionRhsValue symbol variant mismatch")
}

if (
  reteLocation.type !== "RETE_LOCATION" ||
  reteLocation.fieldNumber !== 2 ||
  reteLocation.levelsUp !== 1
) {
  throw new Error("AZProductionRhsValue rete-location variant mismatch")
}

if (
  unboundVariable.type !== "UNBOUND_VARIABLE" ||
  unboundVariable.index !== 3
) {
  throw new Error("AZProductionRhsValue unbound-variable variant mismatch")
}

if (
  functionCall.type !== "FUNCALL" ||
  functionCall.functionName !== symbol ||
  functionCall.arguments.length !== 3
) {
  throw new Error("AZProductionRhsValue function-call variant mismatch")
}

console.log("AZ core production RHS value contract: OK")
