export interface CognitiveLineagePremiseObservation {
  readonly timetag: number
  readonly attribute: string
  readonly value: string
  readonly producerProductionName?: string
  readonly producerProductionChain?: readonly string[]
  readonly causalDepth?: number
}

export interface CognitiveLineageObservation {
  readonly productionName: string
  readonly premises:
    readonly CognitiveLineagePremiseObservation[]
}
