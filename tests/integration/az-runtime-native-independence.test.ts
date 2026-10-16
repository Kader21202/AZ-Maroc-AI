import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot =
  process.cwd()

const entryFile =
  path.resolve(
    projectRoot,
    'src',
    'engines',
    'cognitive',
    'AZNativeCognitiveEngine.ts',
  )

const visited =
  new Set<string>()

const dependencyChain =
  new Map<string, string | null>()

const normalize =
  (value: string): string =>
    value.replace(/\\/g, '/')

const isForbiddenLegacyPath =
  (filePath: string): boolean => {
    const normalized =
      normalize(filePath).toLowerCase()

    return (
      normalized.includes('/legacy/') ||
      normalized.includes('/external-engines/')
    )
  }

const resolveRelativeImport = (
  importer: string,
  specifier: string,
): string => {
  const base =
    path.resolve(
      path.dirname(importer),
      specifier,
    )

  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]

  const resolved =
    candidates.find(candidate =>
      fs.existsSync(candidate),
    )

  if (resolved === undefined) {
    throw new Error(
      `AZ independence audit could not resolve relative import "${specifier}" from "${normalize(importer)}".`,
    )
  }

  return path.resolve(resolved)
}

const readRelativeImports = (
  filePath: string,
): string[] => {
  const sourceText =
    fs.readFileSync(filePath, 'utf8')

  const imports =
    new Set<string>()

  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    let match:
      RegExpExecArray | null

    while (
      (match = pattern.exec(sourceText)) !== null
    ) {
      const specifier =
        match[1]

      if (
        specifier !== undefined &&
        specifier.startsWith('.')
      ) {
        imports.add(specifier)
      }
    }
  }

  return [...imports]
}

const buildChain = (
  filePath: string,
): string[] => {
  const chain: string[] = []

  let current:
    string | null = filePath

  while (current !== null) {
    chain.unshift(
      normalize(
        path.relative(
          projectRoot,
          current,
        ),
      ),
    )

    current =
      dependencyChain.get(current) ?? null
  }

  return chain
}

const traverse =
  (filePath: string): void => {
    const absolutePath =
      path.resolve(filePath)

    if (visited.has(absolutePath)) {
      return
    }

    visited.add(absolutePath)

    assert.equal(
      isForbiddenLegacyPath(absolutePath),
      false,
      [
        'AZ runtime dependency graph reached a forbidden legacy engine path:',
        ...buildChain(absolutePath),
      ].join('\n  -> '),
    )

    for (
      const specifier of
      readRelativeImports(absolutePath)
    ) {
      const dependency =
        resolveRelativeImport(
          absolutePath,
          specifier,
        )

      if (
        !dependencyChain.has(dependency)
      ) {
        dependencyChain.set(
          dependency,
          absolutePath,
        )
      }

      traverse(dependency)
    }
  }

assert.equal(
  fs.existsSync(entryFile),
  true,
  'AZNativeCognitiveEngine.ts entry point was not found.',
)

dependencyChain.set(
  entryFile,
  null,
)

traverse(entryFile)

assert.ok(
  visited.size > 1,
  'AZ independence audit did not traverse the dependency graph.',
)

console.log(
  `AZ runtime native independence: OK (${visited.size} TypeScript files verified)`,
)
