import { AZAlphaMemory } from "../../src/engines/cognitive/az/core/production/AZAlphaMemory"
import type { AZNegativeNode } from "../../src/engines/cognitive/az/core/production/AZNegativeNode"

const alphaMemory = new AZAlphaMemory(
  1,
  null,
  null,
  null,
  false,
)

const node: AZNegativeNode = {
  type: "NEGATIVE",
  nodeId: 2,
  parent: null,
  children: [],
  leftHashFieldNumber: 1,
  leftHashLevelsUp: 2,
  alphaMemory,
  tests: [],
  tokens: [],
  rightUnlinked: false,
}

alphaMemory.addBetaNode(node)

if (node.type !== "NEGATIVE") {
  throw new Error("AZNegativeNode type mismatch")
}

if (node.leftHashFieldNumber !== 1) {
  throw new Error("AZNegativeNode leftHashFieldNumber mismatch")
}

if (node.leftHashLevelsUp !== 2) {
  throw new Error("AZNegativeNode leftHashLevelsUp mismatch")
}

if (node.alphaMemory !== alphaMemory) {
  throw new Error("AZNegativeNode alphaMemory mismatch")
}

if (node.tests.length !== 0) {
  throw new Error("AZNegativeNode tests mismatch")
}

if (node.tokens.length !== 0) {
  throw new Error("AZNegativeNode tokens mismatch")
}

if (node.rightUnlinked) {
  throw new Error("AZNegativeNode rightUnlinked mismatch")
}

if (!alphaMemory.getBetaNodes().includes(node)) {
  throw new Error("AZNegativeNode beta-node registration mismatch")
}

console.log("AZ core RETE negative node contract: OK")
