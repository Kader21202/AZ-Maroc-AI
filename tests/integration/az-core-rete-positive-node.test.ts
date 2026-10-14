import { AZAlphaMemory } from "../../src/engines/cognitive/az/core/production/AZAlphaMemory"
import type { AZPositiveNode } from "../../src/engines/cognitive/az/core/production/AZPositiveNode"

const alphaMemory = new AZAlphaMemory(
  1,
  null,
  null,
  null,
  false,
)

const node: AZPositiveNode = {
  type: "POSITIVE",
  nodeId: null,
  parent: null,
  children: [],
  alphaMemory,
  tests: [],
  leftUnlinked: false,
  rightUnlinked: false,
}

alphaMemory.addBetaNode(node)

if (node.type !== "POSITIVE") {
  throw new Error("AZPositiveNode type mismatch")
}

if (node.alphaMemory !== alphaMemory) {
  throw new Error("AZPositiveNode alphaMemory mismatch")
}

if (node.tests.length !== 0) {
  throw new Error("AZPositiveNode tests mismatch")
}

if (node.leftUnlinked) {
  throw new Error("AZPositiveNode leftUnlinked mismatch")
}

if (node.rightUnlinked) {
  throw new Error("AZPositiveNode rightUnlinked mismatch")
}

if (!alphaMemory.getBetaNodes().includes(node)) {
  throw new Error("AZPositiveNode beta-node registration mismatch")
}

console.log("AZ core RETE positive node contract: OK")
