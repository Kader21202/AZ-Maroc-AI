import type { AZDummyTopNode } from "../../src/engines/cognitive/az/core/production/AZDummyTopNode"

const node: AZDummyTopNode = {
  type: "DUMMY_TOP",
  nodeId: null,
  parent: null,
  children: [],
  tokens: [],
}

if (node.type !== "DUMMY_TOP") {
  throw new Error("AZDummyTopNode type mismatch")
}

if (node.nodeId !== null) {
  throw new Error("AZDummyTopNode nodeId mismatch")
}

if (node.parent !== null) {
  throw new Error("AZDummyTopNode parent mismatch")
}

if (node.tokens.length !== 0) {
  throw new Error("AZDummyTopNode tokens mismatch")
}

console.log("AZ core RETE dummy top node contract: OK")
