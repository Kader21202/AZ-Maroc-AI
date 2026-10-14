import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { CycleObservation } from '../../src/engines/cognitive/az/monitoring/CycleObservation'
import type { CycleObservationHandler } from '../../src/engines/cognitive/az/monitoring/CycleObservationHandler'
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
  public consultationCount = 0
  public lastResolvedValue: string | null = null

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
    this.consultationCount += 1

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

    this.lastResolvedValue =
      record?.capital ?? null

    return this.lastResolvedValue
  }
}

class RecordingObservationHandler
  implements CycleObservationHandler
{
  public readonly observations:
    CycleObservation[] = []

  public handle(
    observation: CycleObservation,
  ): void {
    this.observations.push(
      observation,
    )
  }
}

async function main(): Promise<void> {
  const observationHandler =
    new RecordingObservationHandler()

  const knowledgeSource =
    new FileKnowledgeSource()

  const engine =
    new AZNativeCognitiveEngine(
      undefined,
      observationHandler,
      knowledgeSource,
    )

  const mission: Mission = {
    id: 'az-controlled-knowledge-access',
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

  assert.ok(
    knowledgeSource.consultationCount > 0,
  )

  assert.notEqual(
    knowledgeSource.lastResolvedValue,
    null,
  )

  assert.equal(
    completed.status,
    'COMPLETED',
  )

  assert.equal(
    (
      completed.result as
        | { answer: string }
        | null
    )?.answer,
    knowledgeSource.lastResolvedValue,
  )

  console.log(
    'AZ controlled knowledge access: OK',
  )
}

void main()
