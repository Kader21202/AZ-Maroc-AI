import type { ICognitiveEngine } from "../engines/cognitive/ICognitiveEngine"
import { AZNativeCognitiveEngine } from "../engines/cognitive/AZNativeCognitiveEngine"
import type { Mission } from "../models/Mission"
import type { IOrchestrator } from "./IOrchestrator"

export interface AZNativeOrchestratorOptions {
  readonly cognitiveEngine?: ICognitiveEngine
}

export class AZNativeOrchestrator
  implements IOrchestrator {
  private readonly cognitiveEngine: ICognitiveEngine

  public constructor(
    options: AZNativeOrchestratorOptions = {},
  ) {
    this.cognitiveEngine =
      options.cognitiveEngine ??
      new AZNativeCognitiveEngine()
  }

  public execute(mission: Mission): Promise<Mission> {
    return this.cognitiveEngine.process(mission)
  }
}
