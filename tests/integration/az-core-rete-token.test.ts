import type { AZToken } from "../../src/engines/cognitive/az/core/production/AZToken"

const token: AZToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
}

if (token.parent !== null) {
  throw new Error("AZToken parent mismatch")
}

if (token.workingMemoryElement !== null) {
  throw new Error("AZToken workingMemoryElement mismatch")
}

if (token.node !== null) {
  throw new Error("AZToken node mismatch")
}

if (token.hashReferent !== null) {
  throw new Error("AZToken hashReferent mismatch")
}

if (token.negativeMatches.length !== 0) {
  throw new Error("AZToken negativeMatches mismatch")
}

if (token.children.length !== 0) {
  throw new Error("AZToken children mismatch")
}

console.log("AZ core RETE token contract: OK")
