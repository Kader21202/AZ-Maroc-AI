import type { AZCompletedInstantiationHandler } from './AZInstantiationFiringEngine'
import type { AZInstantiation } from './AZInstantiation'
import { AZSubstateResultDetector } from './AZSubstateResultDetector'
import { AZSubstateGroundExtractor } from './AZSubstateGroundExtractor'
import { AZJustificationMaterializer } from './AZJustificationMaterializer'
import { AZJustificationInstantiationCreator } from './AZJustificationInstantiationCreator'
import type { AZProductionInstaller } from './AZProductionInstaller'

export class AZSubstateJustificationHandler
  implements AZCompletedInstantiationHandler
{
  private nextJustificationId = 1

  public constructor(
    private readonly resultDetector:
      AZSubstateResultDetector,
    private readonly groundExtractor:
      AZSubstateGroundExtractor,
    private readonly materializer:
      AZJustificationMaterializer,
    private readonly productionInstaller:
      AZProductionInstaller,
    private readonly instantiationCreator:
      AZJustificationInstantiationCreator,
  ) {}

  public handle(
    instantiation: AZInstantiation,
  ): readonly AZInstantiation[] {
    const results =
      this.resultDetector.detect(instantiation)


    if (results.length === 0) {
      return []
    }

    const grounds =
      this.groundExtractor.extract(instantiation)

    if (grounds.length === 0) {
      return []
    }

    const justification =
      this.materializer.materialize(
        `az-justify-${this.nextJustificationId++}`,
        grounds,
        results,
      )

    this.productionInstaller.install(
      justification,
    )

    const justificationInstantiation =
      this.instantiationCreator.create(
        justification,
        grounds,
        results,
      )

    return [justificationInstantiation]
  }
}
