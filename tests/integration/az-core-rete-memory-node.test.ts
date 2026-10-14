import type { AZMemoryNode } from "../../src/engines/cognitive/az/core/production/AZMemoryNode"

const node: AZMemoryNode = {
  type: "MEMORY",
  nodeId: 1,
  parent: null,
  children: [],
  leftHashFieldNumber: 2,
  leftHashLevelsUp: 1,
  tokens: [],
}

if (node.type !== "MEMORY") {
  throw new Error("AZMemoryNode type mismatch")
}

if (node.leftHashFieldNumber !== 2) {
  throw new Error("AZMemoryNode leftHashFieldNumber mismatch")
}

if (node.leftHashLevelsUp !== 1) {
  throw new Error("AZMemoryNode leftHashLevelsUp mismatch")
}

if (node.tokens.length !== 0) {
  throw new Error("AZMemoryNode tokens mismatch")
}

console.log("AZ core RETE memory node contract: OK")
