import type { AZCnNode } from "../../src/engines/cognitive/az/core/production/AZCnNode"

const node: AZCnNode = {
  type: "CN",
  nodeId: 4,
  parent: null,
  children: [],
  partner: null,
  tokens: [],
}

const partner: AZCnNode = {
  type: "CN_PARTNER",
  nodeId: null,
  parent: null,
  children: [],
  partner: node,
  tokens: [],
}

node.partner = partner

if (node.type !== "CN") {
  throw new Error("AZCnNode type mismatch")
}

if (partner.type !== "CN_PARTNER") {
  throw new Error("AZCnNode partner type mismatch")
}

if (node.partner !== partner) {
  throw new Error("AZCnNode partner link mismatch")
}

if (partner.partner !== node) {
  throw new Error("AZCnNode reverse partner link mismatch")
}

if (node.tokens.length !== 0 || partner.tokens.length !== 0) {
  throw new Error("AZCnNode tokens mismatch")
}

console.log("AZ core RETE CN node contract: OK")
