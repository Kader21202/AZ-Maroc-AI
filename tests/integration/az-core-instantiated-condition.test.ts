import type { AZWorkingMemoryElement } from "../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement"
import type { AZProductionCondition } from "../../src/engines/cognitive/az/core/production/AZProductionCondition"
import type { AZProductionTest } from "../../src/engines/cognitive/az/core/production/AZProductionTest"
import type { AZInstantiatedCondition } from "../../src/engines/cognitive/az/core/production/AZInstantiatedCondition"

const equalityTest: AZProductionTest = {
  type: "EQUALITY",
  referent: {
    id: "v1",
    hashId: 1,
    type: "VARIABLE",
    value: "<v>",
  },
}

const positiveSource: Extract<
  AZProductionCondition,
  { readonly type: "POSITIVE" }
> = {
  type: "POSITIVE",
  identifierTest: equalityTest,
  attributeTest: equalityTest,
  valueTest: equalityTest,
  acceptable: false,
}

const negativeSource: Extract<
  AZProductionCondition,
  { readonly type: "NEGATIVE" }
> = {
  type: "NEGATIVE",
  identifierTest: equalityTest,
  attributeTest: equalityTest,
  valueTest: equalityTest,
  acceptable: false,
}

const conjunctiveSource: Extract<
  AZProductionCondition,
  { readonly type: "CONJUNCTIVE_NEGATION" }
> = {
  type: "CONJUNCTIVE_NEGATION",
  conditions: [negativeSource],
}

const wme = null as AZWorkingMemoryElement | null

const positive: AZInstantiatedCondition = {
  type: "POSITIVE",
  sourceCondition: positiveSource,
  workingMemoryElement: wme,
}

const negative: AZInstantiatedCondition = {
  type: "NEGATIVE",
  sourceCondition: negativeSource,
}

const conjunctive: AZInstantiatedCondition = {
  type: "CONJUNCTIVE_NEGATION",
  sourceCondition: conjunctiveSource,
  conditions: [positive, negative],
}

if (
  positive.type !== "POSITIVE" ||
  negative.type !== "NEGATIVE" ||
  conjunctive.type !== "CONJUNCTIVE_NEGATION" ||
  conjunctive.conditions.length !== 2
) {
  throw new Error("AZInstantiatedCondition contract mismatch")
}

console.log("AZ core instantiated condition contract: OK")
