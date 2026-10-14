import { AZAlphaMemory } from "../../src/engines/cognitive/az/core/production/AZAlphaMemory"
import type { AZMpNode } from "../../src/engines/cognitive/az/core/production/AZMpNode"

const alphaMemory = new AZAlphaMemory(
  1,
  null,
  null,
  null,
  false,
)

const node: AZMpNode = {
  type: "MP",
  nodeId: 3,
  parent: null,
  children: [],
  leftHashFieldNumber: 2,
  leftHashLevelsUp: 1,
  alphaMemory,
  tests: [],
  tokens: [],
  leftUnlinked: false,
  rightUnlinked: false,
}

alphaMemory.addBetaNode(node)

if (node.type !== "MP") {
  throw new Error("AZMpNode type mismatch")
}

if (node.leftHashFieldNumber !== 2) {
  throw new Error("AZMpNode leftHashFieldNumber mismatch")
}

if (node.leftHashLevelsUp !== 1) {
  throw new Error("AZMpNode leftHashLevelsUp mismatch")
}

if (node.alphaMemory !== alphaMemory) {
  throw new Error("AZMpNode alphaMemory mismatch")
}

if (node.tests.length !== 0) {
  throw new Error("AZMpNode tests mismatch")
}

if (node.tokens.length !== 0) {
  throw new Error("AZMpNode tokens mismatch")
}

if (node.leftUnlinked) {
  throw new Error("AZMpNode leftUnlinked mismatch")
}

if (node.rightUnlinked) {
  throw new Error("AZMpNode rightUnlinked mismatch")
}

if (!alphaMemory.getBetaNodes().includes(node)) {
  throw new Error("AZMpNode beta-node registration mismatch")
}

console.log("AZ core RETE MP node contract: OK")
