const { spawnSync } = require('node:child_process')
const { join } = require('node:path')
const { mkdirSync, mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')

const root = process.cwd()
const output = join(root, 'build', 'az-d1-m1')
const experiments = join(root, 'tests', 'experiments', 'az-d1-m1')
const executable = join(output, 'tests', 'experiments', 'az-d1-m1')

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} failed: exit ${result.status}`)
  }
}

mkdirSync(output, { recursive: true })

run(process.execPath, [
  require('node:path').join(require('node:path').dirname(require.resolve('typescript/package.json')), 'lib', 'tsc.js'), '--ignoreConfig', '--strict',
  '--target', 'es2022',
  '--module', 'node16',
  '--moduleResolution', 'node16',
  '--types', 'node',
  '--esModuleInterop',
  '--skipLibCheck',
  '--rootDir', '.',
  '--outDir', output,
  join(experiments, 'producer.ts'),
  join(experiments, 'consumer.ts'),
])

const temporary = mkdtempSync(join(tmpdir(), 'az-d1-m1-'))

try {
  for (const [payload, expected] of [
    ['alpha', 'yes'],
    ['beta', 'no'],
  ]) {
    const memory = join(temporary, `${payload}.json`)

    run(process.execPath, [
      join(executable, 'producer.js'),
      payload,
      memory,
    ])

    run(process.execPath, [
      join(executable, 'consumer.js'),
      memory,
      expected,
    ])
  }

  console.log('AZ-D1-M1 REPRODUCIBILITY: PASS')
} finally {
  rmSync(temporary, { recursive: true, force: true })
}



