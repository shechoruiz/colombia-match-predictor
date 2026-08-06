#!/usr/bin/env node
// Secure environment-key manager.
// Keys are stored in .env (never committed) WITHOUT any VITE_ prefix so Vite
// never injects them into the public bundle. This script never prints values.
import { constants } from 'node:fs'
import { access, chmod, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const ENV_FILE = join(ROOT, '.env')
const ENV_EXAMPLE_FILE = join(ROOT, '.env.example')
const DIST_DIR = join(ROOT, 'dist')

// Non-VITE_ key names in the committed template. These are the canonical set.
const REQUIRED_KEYS = ['API_FOOTBALL_KEY', 'THESPORTSDB_KEY']

// Identifiers like `ENTER_.*` are too broad; we only reject the VITE_ prefix
// that would let Vite bundle the value, plus require a plain upper-case name.
const KEY_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/

class ScriptError extends Error {}

function fail(message) {
  console.error(`manage-keys: ${message}`)
  process.exit(1)
}

async function readEnvFile() {
  try {
    await access(ENV_FILE, constants.R_OK)
    return await readFile(ENV_FILE, 'utf8')
  } catch {
    return ''
  }
}

function parseEnv(content) {
  const entries = new Map()
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue
    const equalIndex = line.indexOf('=')
    if (equalIndex === -1) continue
    entries.set(line.slice(0, equalIndex).trim(), line.slice(equalIndex + 1).trim())
  }
  return entries
}

async function doesEnvFileExist() {
  try {
    await access(ENV_FILE, constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function modeIs0600() {
  try {
    const { mode } = await stat(ENV_FILE)
    // Effective permission bits: owner read/write (0600), nothing else.
    return (mode & 0o777) === 0o600
  } catch {
    return false
  }
}

async function assertKeyValueNotInDist(keyValue) {
  if (keyValue === '') return
  try {
    await access(DIST_DIR, constants.F_OK)
  } catch {
    return // no build output yet — nothing to leak into
  }
  const { readdir, readFile: readDistFile } = await import('node:fs/promises')
  const stack = [DIST_DIR]
  const leakedFiles = []
  while (stack.length > 0) {
    const current = stack.pop()
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile()) {
        const content = await readDistFile(full, 'utf8')
        if (content.includes(keyValue)) leakedFiles.push(full)
      }
    }
  }
  if (leakedFiles.length > 0) {
    fail(
      `value for a configured key was found in ${leakedFiles.length} dist file(s) ` +
        '(see a .env that leaks into the public bundle). Check build source.',
    )
  }
}

function writeEnvSorted(entries) {
  const lines = [...entries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
  return lines.join('\n') + '\n'
}

async function cmdSet(name, value) {
  if (name === undefined || value === undefined) {
    fail('usage: manage-keys set <NAME> <value>')
  }
  if (!KEY_NAME_PATTERN.test(name)) {
    fail(`invalid key name "${name}". Use upper-case letters, digits, underscores.`)
  }
  if (name.startsWith('VITE_')) {
    fail(`refusing VITE_ prefix: "${name}" would be bundled into the public client and is forbidden.`)
  }
  if (value.trim() === '') {
    fail(`refusing empty value for "${name}".`)
  }

  const content = await readEnvFile()
  const entries = parseEnv(content)
  entries.set(name, value.trim())
  await writeFile(ENV_FILE, writeEnvSorted(entries), { mode: 0o600 })
  await chmod(ENV_FILE, 0o600)
  console.log(`set: ${name} configured (value not shown).`)
}

async function cmdStatus() {
  const content = await readEnvFile()
  const entries = parseEnv(content)
  for (const key of REQUIRED_KEYS) {
    const configured = entries.has(key) && entries.get(key) !== ''
    console.log(`${configured ? 'configured' : 'missing    '}  ${key}`)
  }
  const actualKeys = [...entries.keys()].filter((k) => !REQUIRED_KEYS.includes(k))
  if (actualKeys.length > 0) {
    console.log('Extra keys present:')
    for (const key of actualKeys) console.log(`  ${key}`)
  } else {
    console.log('No extra keys present.')
  }
}

async function cmdVerify() {
  if (!(await doesEnvFileExist())) {
    console.log('verify: FAIL — .env not present.')
    process.exitCode = 1
  } else {
    const permsOk = await modeIs0600()
    console.log(`verify: ${permsOk ? 'PASS' : 'FAIL'} — .env permissions ${permsOk ? '0600' : 'are not 0600'}`)
    if (!permsOk) process.exitCode = 1
  }
  const content = await readEnvFile()
  const entries = parseEnv(content)
  const present = REQUIRED_KEYS.filter((k) => entries.has(k) && entries.get(k) !== '')
  const missing = REQUIRED_KEYS.filter((k) => !present.includes(k))
  for (const key of present) console.log(`verify: PRESENT  ${key}`)
  for (const key of missing) console.log(`verify: MISSING  ${key}`)
  if (missing.length > 0) process.exitCode = 1
  for (const key of present) await assertKeyValueNotInDist(entries.get(key) ?? '')
  console.log('verify: no key value leaked into dist/.')
  console.log('verify: done.')
}

const [command, ...args] = process.argv.slice(2)
const commands = { set: cmdSet, status: cmdStatus, verify: cmdVerify }
if (!(command in commands)) {
  fail(`unknown command "${command ?? ''}". Use: set <NAME> <value> | status | verify`)
}
void commands[command](...args)