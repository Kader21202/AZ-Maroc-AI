import type { AZWorkingMemoryElement } from '../memory/AZWorkingMemoryElement'
import type { AZSymbol } from '../symbols/AZSymbol'
import type { AZStateStackEntry } from '../state/AZStateStack'

export class AZIoState {
  public previousTopState:
    AZStateStackEntry | null = null

  public ioHeader:
    AZSymbol | null = null

  public inputLink:
    AZSymbol | null = null

  public outputLink:
    AZSymbol | null = null

  public ioHeaderLink:
    AZWorkingMemoryElement | null = null

  public outputLinkChanged = false
}
