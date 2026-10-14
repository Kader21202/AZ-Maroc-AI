import type { AZSymbol } from "../../src/engines/cognitive/az/core/symbols/AZSymbol"
import type { AZProduction } from "../../src/engines/cognitive/az/core/production/AZProduction"
import type { AZProductionNode } from "../../src/engines/cognitive/az/core/production/AZProductionNode"
import type { AZInstantiation } from "../../src/engines/cognitive/az/core/production/AZInstantiation"
import type { AZPreference } from "../../src/engines/cognitive/az/core/operator/AZPreference"
import type { AZPreferenceSlot } from "../../src/engines/cognitive/az/core/operator/AZPreferenceSlot"

const identifier: AZSymbol = {
  id: "S1",
  hashId: 1,
  type: "IDENTIFIER",
  value: "S1",
}

const attribute: AZSymbol = {
  id: "operator",
  hashId: 2,
  type: "STRING_CONSTANT",
  value: "operator",
}

const value: AZSymbol = {
  id: "O1",
  hashId: 3,
  type: "IDENTIFIER",
  value: "O1",
}

let production!: AZProduction
let productionNode!: AZProductionNode
let instantiation!: AZInstantiation
let preference!: AZPreference
let slot!: AZPreferenceSlot

production = {
  name: "az-test-production",
  declaredSupport: "UNDECLARED",
  conditions: [],
  actions: [],
  instantiations: [],
  productionNode: null,
}

productionNode = {
  type: "PRODUCTION",
  nodeId: 1,
  parent: null,
  children: [],
  production,
  tokens: [],
}

production.productionNode = productionNode

instantiation = {
  id: 1,
  production,
  instantiatedConditions: [],
  matchGoal: identifier,
  matchGoalLevel: 1,
  inMatchSet: true,
  generatedPreferences: [],
  reteToken: null,
  reteWme: null,
}

slot = {
  identifier,
  attribute,
  allPreferences: [],
  preferencesByType: new Map(),
  wmes: [],
  isaContextSlot: false,
  impasseType: "NONE",
  impasseId: null,
  acceptablePreferenceChanged: false,
  acceptablePreferenceWmes: [],
  changed: false,
  markedForPossibleRemoval: false,
}

preference = {
  type: "ACCEPTABLE",
  identifier,
  attribute,
  value,
  referent: null,
  level: 1,
  numericValue: 0,
  oSupported: false,
  inTemporaryMemory: true,
  slot,
  instantiation,
}

instantiation.generatedPreferences.push(preference)
production.instantiations.push(instantiation)
slot.allPreferences.push(preference)
slot.preferencesByType.set("ACCEPTABLE", [preference])

if (
  production.productionNode !== productionNode ||
  productionNode.production !== production ||
  instantiation.generatedPreferences[0] !== preference ||
  preference.instantiation !== instantiation ||
  preference.slot !== slot ||
  slot.allPreferences[0] !== preference ||
  slot.preferencesByType.get("ACCEPTABLE")?.[0] !== preference
) {
  throw new Error("AZ production/preference state graph contract mismatch")
}

console.log("AZ core production/preference state graph contract: OK")
