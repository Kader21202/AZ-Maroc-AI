import type { AZRightLinkedReteNode } from "../../src/engines/cognitive/az/core/production/AZRightLinkedReteNode"

const positive = {
  type: "POSITIVE",
  rightUnlinked: false,
} as AZRightLinkedReteNode

const mp = {
  type: "MP",
  rightUnlinked: true,
} as AZRightLinkedReteNode

const negative = {
  type: "NEGATIVE",
  rightUnlinked: false,
} as AZRightLinkedReteNode

if (positive.type !== "POSITIVE") {
  throw new Error("AZ right-linked positive node mismatch")
}

if (mp.type !== "MP") {
  throw new Error("AZ right-linked MP node mismatch")
}

if (negative.type !== "NEGATIVE") {
  throw new Error("AZ right-linked negative node mismatch")
}

console.log("AZ core right-linked RETE node contract: OK")
