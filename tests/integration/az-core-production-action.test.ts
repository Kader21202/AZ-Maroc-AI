import type { AZSymbol } from "../../src/engines/cognitive/az/core/symbols/AZSymbol"
import type { AZProductionAction } from "../../src/engines/cognitive/az/core/production/AZProductionAction"
import type { AZProductionRhsValue } from "../../src/engines/cognitive/az/core/production/AZProductionRhsValue"

const symbol: AZSymbol = {
  id: "s1",
  hashId: 1,
  type: "STRING_CONSTANT",
  value: "value",
}

const rhsValue: AZProductionRhsValue = {
  type: "SYMBOL",
  symbol,
}

const makeAction: AZProductionAction = {
  type: "MAKE",
  preferenceType: "ACCEPTABLE",
  identifier: rhsValue,
  attribute: rhsValue,
  value: rhsValue,
  referent: rhsValue,
  support: "O_SUPPORT",
}

const funcallAction: AZProductionAction = {
  type: "FUNCALL",
  functionCall: {
    type: "FUNCALL",
    functionName: symbol,
    arguments: [rhsValue],
  },
}

if (
  makeAction.type !== "MAKE" ||
  makeAction.preferenceType !== "ACCEPTABLE" ||
  makeAction.support !== "O_SUPPORT" ||
  makeAction.referent !== rhsValue
) {
  throw new Error("AZProductionAction MAKE variant mismatch")
}

if (
  funcallAction.type !== "FUNCALL" ||
  funcallAction.functionCall.type !== "FUNCALL"
) {
  throw new Error("AZProductionAction FUNCALL variant mismatch")
}

console.log("AZ core production action contract: OK")
