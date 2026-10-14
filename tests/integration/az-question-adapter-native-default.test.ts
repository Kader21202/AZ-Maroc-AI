import { strict as assert } from 'node:assert'
import { AZQuestionAdapter } from '../../src/application/AZQuestionAdapter'

async function main(): Promise<void> {
  let nextId = 0

  const adapter = new AZQuestionAdapter({
    createId: () =>
      `az-question-native-${++nextId}`,
  })

  const supported = await adapter.ask(
    '  Quel est le statut de la plateforme ?  ',
  )

  assert.equal(
    supported.missionId,
    'az-question-native-1',
  )

  assert.equal(
    supported.status,
    'COMPLETED',
  )

  assert.equal(
    (
      supported.result as {
        engine?: string
        question?: string
      } | null
    )?.engine,
    'az-native',
  )

  assert.equal(
    (
      supported.result as {
        question?: string
      } | null
    )?.question,
    'Quel est le statut de la plateforme ?',
  )

  await assert.rejects(
    () => adapter.ask('   '),
    /non-empty string/,
  )

  console.log(
    'AZ question adapter native default: OK',
  )
}

void main()
