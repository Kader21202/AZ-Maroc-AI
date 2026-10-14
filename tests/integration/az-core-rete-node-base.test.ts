import type { AZReteNodeBase } from "../../src/engines/cognitive/az/core/production/AZReteNodeBase"

const node: AZReteNodeBase = {
  type: "DUMMY_TOP",
  nodeId: null,
  parent: null,
  children: [],
}

if (node.type !== "DUMMY_TOP") {
  throw new Error("AZReteNodeBase type mismatch")
}

if (node.nodeId !== null) {
  throw new Error("AZReteNodeBase nodeId mismatch")
}

if (node.parent !== null) {
  throw new Error("AZReteNodeBase parent mismatch")
}

if (node.children.length !== 0) {
  throw new Error("AZReteNodeBase children mismatch")
}

console.log("AZ core RETE node base contract: OK")
