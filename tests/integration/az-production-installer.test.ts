import assert from 'node:assert/strict'
import type { AZProduction } from '../../src/engines/cognitive/az/core/production/AZProduction'
import type { AZProductionMatcher } from '../../src/engines/cognitive/az/core/production/AZProductionMatcher'
import { AZProceduralMemory } from '../../src/engines/cognitive/az/core/production/AZProceduralMemory'
import { AZDefaultProductionInstaller } from '../../src/engines/cognitive/az/core/production/AZProductionInstaller'
import { AZMatchSet } from '../../src/engines/cognitive/az/core/production/AZMatchSet'

const proceduralMemory =
  new AZProceduralMemory()

const matchSet =
  new AZMatchSet()

const installed:
  AZProduction[] = []

const excised:
  AZProduction[] = []

let nextResult:
  | 'NO_REFRACTED_INSTANTIATION'
  | 'DUPLICATE_PRODUCTION' =
    'NO_REFRACTED_INSTANTIATION'

const matcher:
  AZProductionMatcher = {
    addProduction(
      production: AZProduction,
    ) {
      installed.push(production)
      return nextResult
    },

    exciseProduction(
      production: AZProduction,
    ) {
      excised.push(production)
    },

    getMatchSet() {
      return matchSet
    },
  }

const installer =
  new AZDefaultProductionInstaller(
    proceduralMemory,
    matcher,
  )

const makeProduction = (
  name: string,
): AZProduction => ({
  name,
  declaredSupport: 'UNDECLARED',
  conditions: [],
  actions: [],
  instantiations: [],
})

const first =
  makeProduction('p-first')

assert.equal(
  installer.install(first),
  'NO_REFRACTED_INSTANTIATION',
)

assert.equal(
  proceduralMemory.findByName(
    'p-first',
  ),
  first,
)

assert.deepEqual(
  proceduralMemory.getAll(),
  [first],
)

assert.equal(
  installed.length,
  1,
)

assert.throws(
  () =>
    installer.install(
      makeProduction('p-first'),
    ),
  /already registered in procedural memory/,
)

assert.equal(
  installed.length,
  1,
)

nextResult =
  'DUPLICATE_PRODUCTION'

const duplicate =
  makeProduction('p-duplicate')

assert.equal(
  installer.install(duplicate),
  'DUPLICATE_PRODUCTION',
)

assert.equal(
  proceduralMemory.findByName(
    'p-duplicate',
  ),
  undefined,
)

assert.equal(
  installed.length,
  2,
)

assert.equal(
  excised.length,
  0,
)

const removable =
  makeProduction('p-removable')

assert.equal(
  proceduralMemory.add(
    removable,
  ),
  true,
)

assert.equal(
  proceduralMemory.add(
    makeProduction('p-removable'),
  ),
  false,
)

assert.equal(
  proceduralMemory.remove(
    makeProduction('p-removable'),
  ),
  false,
)

assert.equal(
  proceduralMemory.remove(
    removable,
  ),
  true,
)

assert.equal(
  proceduralMemory.findByName(
    'p-removable',
  ),
  undefined,
)

proceduralMemory.clear()

assert.equal(
  proceduralMemory.getAll().length,
  0,
)

console.log(
  'AZ procedural memory and production installer: OK',
)

class RejectingProceduralMemory
  extends AZProceduralMemory
{
  public override add(
    _production: AZProduction,
  ): boolean {
    return false
  }
}

{
  const rejectingMemory =
    new RejectingProceduralMemory()

  const rollbackInstalled:
    AZProduction[] = []

  const rollbackExcised:
    AZProduction[] = []

  const rollbackMatcher:
    AZProductionMatcher = {
      addProduction(
        production: AZProduction,
      ) {
        rollbackInstalled.push(
          production,
        )

        return 'NO_REFRACTED_INSTANTIATION'
      },

      exciseProduction(
        production: AZProduction,
      ) {
        rollbackExcised.push(
          production,
        )
      },

      getMatchSet() {
        return matchSet
      },
    }

  const rollbackInstaller =
    new AZDefaultProductionInstaller(
      rejectingMemory,
      rollbackMatcher,
    )

  const rollbackProduction =
    makeProduction(
      'p-installer-rollback',
    )

  assert.throws(
    () =>
      rollbackInstaller.install(
        rollbackProduction,
      ),
    /could not be registered in procedural memory/,
  )

  assert.deepEqual(
    rollbackInstalled,
    [rollbackProduction],
  )

  assert.deepEqual(
    rollbackExcised,
    [rollbackProduction],
  )
}
