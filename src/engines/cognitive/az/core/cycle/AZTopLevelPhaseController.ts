export type AZTopLevelPhase =
  | 'INPUT'
  | 'PROPOSE'
  | 'DECIDE'
  | 'APPLY'
  | 'OUTPUT'

export interface AZTopLevelPhaseController {
  readonly currentPhase:
    AZTopLevelPhase

  executeOnePhase(): void
}

export class AZDefaultTopLevelPhaseController
  implements AZTopLevelPhaseController
{
  public currentPhase:
    AZTopLevelPhase = 'INPUT'

  public executeOnePhase(): void {
    switch (this.currentPhase) {
      case 'INPUT':
        this.currentPhase =
          'PROPOSE'
        return

      case 'PROPOSE':
        this.currentPhase =
          'DECIDE'
        return

      case 'DECIDE':
        this.currentPhase =
          'APPLY'
        return

      case 'APPLY':
        this.currentPhase =
          'OUTPUT'
        return

      case 'OUTPUT':
        this.currentPhase =
          'INPUT'
        return
    }
  }
}
