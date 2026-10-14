import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { CycleObservation } from '../../src/engines/cognitive/az/monitoring/CycleObservation'
import type { CycleObservationHandler } from '../../src/engines/cognitive/az/monitoring/CycleObservationHandler'
import { ProgressMonitor } from '../../src/engines/cognitive/az/monitoring/ProgressMonitor'
import type { KnowledgeSource } from '../../src/engines/cognitive/az/knowledge/KnowledgeSource'
import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import type { Mission } from '../../src/models/Mission'

interface CapitalRecord {
  readonly country: string
  readonly capital: string
}

class FileKnowledgeSource
  implements KnowledgeSource
{
  private readonly records: CapitalRecord[]

  public constructor() {
    const path =
      join(
        process.cwd(),
        'tests',
        'fixtures',
        'knowledge',
        'capitals.json',
      )

    this.records =
      JSON.parse(
        readFileSync(path, 'utf8'),
      ) as CapitalRecord[]
  }

  public lookup(
    question: string,
  ): string | null {
    const normalizedQuestion =
      question.toLocaleLowerCase()

    const record =
      this.records.find(
        (candidate) =>
          normalizedQuestion.includes(
            candidate.country
              .toLocaleLowerCase(),
          ),
      )

    return record?.capital ?? null
  }
}

class RealTestObservationHandler
  implements CycleObservationHandler
{
  public readonly observations:
    CycleObservation[] = []

  public readonly progressMonitor =
    new ProgressMonitor()

  public handle(
    observation: CycleObservation,
  ): void {
    this.observations.push(
      observation,
    )

    this.progressMonitor.handle(
      observation,
    )
  }
}

async function main(): Promise<void> {
  const observationHandler =
    new RealTestObservationHandler()

  const knowledgeSource =
    new FileKnowledgeSource()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      observationHandler,
      knowledgeSource,
    )

  const mission: Mission = {
    id: 'az-real-capital-question',
    request:
      'Quelle est la capitale du Maroc ?',
    status: 'CREATED',
    workingState: {
      situation: {},
      goals: [],
      activeAction: null,
      intermediateResults: [],
    },
    result: null,
  }

  const completed =
    await engine.process(mission)

  console.log(
    'QUESTION:',
    mission.request,
  )

  console.log(
    'STATUS:',
    completed.status,
  )

  console.log(
    'RESULT:',
    completed.result,
  )

  console.log(
    'CYCLES:',
    observationHandler.observations.length,
  )

  for (
    const observation
    of observationHandler.observations
  ) {
    console.log(
      'CYCLE:',
      observation.cycle,
      {
        goal: observation.currentGoalId,
        goalDepth: observation.goalDepth,
        impasse: observation.impasseType,
        operator:
          observation.currentOperatorId,
        structuralState:
          observation.structuralState,
        outputProduced:
          observation.outputProduced,
        halted: observation.halted,
        stopReason:
          observation.stopReason,
      },
    )
  }

  console.log(
    'TRAJECTORY:',
    observationHandler
      .progressMonitor
      .getTrajectoryDynamics(),
  )

  console.log(
    'PROGRESS:',
    observationHandler
      .progressMonitor
      .getProgressAssessment(),
  )
}

void main()
