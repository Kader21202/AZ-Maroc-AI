import type { AZWorkingMemoryElement } from "../../src/engines/cognitive/az/core/memory/AZWorkingMemoryElement"
import type { AZRightMemory } from "../../src/engines/cognitive/az/core/production/AZRightMemory"

const wme = {} as AZWorkingMemoryElement

const rightMemory: AZRightMemory = {
  workingMemoryElement: wme,
  alphaMemoryId: 7,
}

if (rightMemory.workingMemoryElement !== wme) {
  throw new Error("AZRightMemory WME mismatch")
}

if (rightMemory.alphaMemoryId !== 7) {
  throw new Error("AZRightMemory alphaMemoryId mismatch")
}

console.log("AZ core right memory contract: OK")
