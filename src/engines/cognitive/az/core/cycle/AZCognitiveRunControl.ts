export interface AZCognitiveRunControl {
  isHalted(): boolean

  halt(reason: string): void

  reasonForStopping(): string | null
}
