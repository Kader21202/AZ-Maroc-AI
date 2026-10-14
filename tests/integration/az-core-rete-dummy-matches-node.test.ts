import type { AZDummyMatchesNode } from "../../src/engines/cognitive/az/core/production/AZDummyMatchesNode"

const node: AZDummyMatchesNode = {
  type: "DUMMY_MATCHES",
  nodeId: null,
  parent: null,
  children: [],
}

if (node.type !== "DUMMY_MATCHES") {
  throw new Error("AZDummyMatchesNode type mismatch")
}

if (node.nodeId !== null) {
  throw new Error("AZDummyMatchesNode nodeId mismatch")
}

if (node.parent !== null) {
  throw new Error("AZDummyMatchesNode parent mismatch")
}

if (node.children.length !== 0) {
  throw new Error("AZDummyMatchesNode children mismatch")
}

console.log("AZ core RETE dummy matches node contract: OK")
