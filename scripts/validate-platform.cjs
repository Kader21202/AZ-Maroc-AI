const { spawnSync } = require("node:child_process")
const {
  existsSync,
  readdirSync,
  rmSync,
} = require("node:fs")
const { resolve } = require("node:path")

const projectRoot = process.cwd()

const typescriptCompiler = resolve(
  projectRoot,
  "node_modules",
  "typescript",
  "bin",
  "tsc",
)

const buildTypeScriptRoot = resolve(
  projectRoot,
  "build",
  "typescript",
)

const buildRoot = resolve(
  buildTypeScriptRoot,
  "tests",
  "integration",
)

function run(command, args, label) {
  console.log("")
  console.log(`▶ ${label}`)

  const execution = spawnSync(
    command,
    args,
    {
      cwd: projectRoot,
      stdio: "inherit",
      shell: false,
    },
  )

  if (execution.error) {
    console.error(`✗ ${label}`)
    console.error(execution.error.message)
    process.exit(1)
  }

  if (execution.status !== 0) {
    console.error(`✗ ${label}`)
    process.exit(execution.status ?? 1)
  }

  console.log(`✓ ${label}`)
}

console.log("==============================================")
console.log("AZ-Maroc-AI Platform Validation")
console.log("==============================================")

if (!existsSync(typescriptCompiler)) {
  console.error(
    `✗ TypeScript compiler not found: ${typescriptCompiler}`,
  )
  process.exit(1)
}

console.log("")
console.log("▶ Clean TypeScript build")

rmSync(
  buildTypeScriptRoot,
  {
    recursive: true,
    force: true,
  },
)

console.log("✓ Clean TypeScript build")

run(
  process.execPath,
  [
    typescriptCompiler,
    "--noEmit",
  ],
  "TypeScript typecheck",
)

run(
  process.execPath,
  [
    typescriptCompiler,
    "-p",
    "tsconfig.build.json",
  ],
  "TypeScript build",
)

if (!existsSync(buildRoot)) {
  console.error("")
  console.error(
    `✗ Compiled integration directory not found: ${buildRoot}`,
  )
  process.exit(1)
}

const integrationTests =
  readdirSync(buildRoot)
    .filter(
      (fileName) =>
        fileName.startsWith("az-") &&
        fileName.endsWith(".test.js"),
    )
    .sort()

if (integrationTests.length === 0) {
  console.error("")
  console.error("✗ No compiled AZ integration tests found")
  process.exit(1)
}

console.log("")
console.log(
  `▶ AZ integration suite (${integrationTests.length} tests)`,
)

let passedTests = 0

for (const testFile of integrationTests) {
  run(
    process.execPath,
    [resolve(buildRoot, testFile)],
    testFile,
  )

  passedTests += 1
}

console.log("")
console.log(
  `✓ AZ integration suite (${passedTests}/${integrationTests.length})`,
)

console.log("")
console.log("==============================================")
console.log("AZ-Maroc-AI platform validation: SUCCESS")
console.log("==============================================")
