import { AZAlphaMemory } from "../../src/engines/cognitive/az/core/production/AZAlphaMemory"
import type { AZSymbol } from "../../src/engines/cognitive/az/core/symbols/AZSymbol"

const identifier: AZSymbol = {
  id: "S1",
  hashId: 137,
  type: "IDENTIFIER",
  value: "S1",
}

const memory = new AZAlphaMemory(
  0,
  identifier,
  null,
  null,
  false,
)

if (memory.id !== 0) {
  throw new Error("AZAlphaMemory id mismatch")
}

if (memory.identifier !== identifier) {
  throw new Error("AZAlphaMemory identifier mismatch")
}

if (memory.attribute !== null) {
  throw new Error("AZAlphaMemory attribute mismatch")
}

if (memory.value !== null) {
  throw new Error("AZAlphaMemory value mismatch")
}

if (memory.acceptable !== false) {
  throw new Error("AZAlphaMemory acceptable mismatch")
}

if (memory.referenceCount !== 1) {
  throw new Error("AZAlphaMemory reference count mismatch")
}

console.log("AZ core alpha memory contract: OK")
