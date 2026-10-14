import { strict as assert } from 'node:assert'

import { AZNativeCognitiveEngine } from '../../src/engines/cognitive/AZNativeCognitiveEngine'
import type { Mission } from '../../src/models/Mission'

async function main(): Promise<void> {
  const mission: Mission = {
    id: 'az-native-test',
    request: 'Quel est le statut de la plateforme ?',
    status: 'CREATED',
    workingState: {
      situation: {},
      goals: [],
      activeAction: null,
      intermediateResults: [],
    },
    result: null,
  }

  const engine =
    new AZNativeCognitiveEngine()

  const completed =
    await engine.process(mission)

  assert.equal(
    completed.status,
    'COMPLETED',
  )

  assert.deepEqual(
    completed.result,
    {
      engine: 'az-native',
      question:
        'Quel est le statut de la plateforme ?',
      answer: 'AZ-Maroc-AI completed the cognitive application cycle.',
    },
  )

  console.log(
    'AZ native cognitive engine question-to-result: OK',
  )
}

void main()



