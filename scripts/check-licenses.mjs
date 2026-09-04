#!/usr/bin/env node
/**
 * Zero-dependency license audit.
 *
 * Walks every package in node_modules, reads its declared `license` field, and
 * groups the results. Written in-house on purpose: the popular license checkers
 * on npm are BSD-3-Clause, and this project keeps its own tooling MIT.
 *
 * Usage:
 *   node scripts/check-licenses.mjs           human-readable summary
 *   node scripts/check-licenses.mjs --json    machine-readable output
 *
 * Exits non-zero if any package declares a license outside ALLOWED.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Permissive licenses that are safe to redistribute inside an MIT project. */
const ALLOWED = new Set([
  'MIT',
  'MIT-0',
  'ISC',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'Unlicense',
  'BlueOak-1.0.0',
  'Python-2.0',
  'WTFPL',
]);

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const asJson = process.argv.includes('--json');

/** Reduce an SPDX expression to its constituent identifiers. */
function spdxParts(expression) {
  return expression
    .replace(/[()]/g, ' ')
    .split(/\s+(?:OR|AND)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function readLicense(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license?.type) return pkg.license.type;
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map((l) => (typeof l === 'string' ? l : l.type)).join(' OR ');
  }
  return 'UNKNOWN';
}

/** An expression passes if any single alternative is allowed (OR semantics). */
function isAllowed(expression) {
  const parts = spdxParts(expression);
  if (parts.length === 0) return false;
  return /\sOR\s/i.test(expression)
    ? parts.some((p) => ALLOWED.has(p))
    : parts.every((p) => ALLOWED.has(p));
}

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === '.bin') continue;
    const path = join(dir, entry.name);

    if (entry.name.startsWith('@')) {
      yield* walk(path);
      continue;
    }

    try {
      const pkg = JSON.parse(await readFile(join(path, 'package.json'), 'utf8'));
      if (pkg.name) yield { name: pkg.name, version: pkg.version, license: readLicense(pkg) };
    } catch {
      // Not a package directory; ignore.
    }

    yield* walk(join(path, 'node_modules'));
  }
}

const packages = [];
for await (const pkg of walk(join(ROOT, 'node_modules'))) packages.push(pkg);
packages.sort((a, b) => a.name.localeCompare(b.name));

const byLicense = new Map();
for (const pkg of packages) {
  if (!byLicense.has(pkg.license)) byLicense.set(pkg.license, []);
  byLicense.get(pkg.license).push(pkg);
}

const disallowed = packages.filter((pkg) => !isAllowed(pkg.license));

if (asJson) {
  console.log(JSON.stringify({ total: packages.length, packages, disallowed }, null, 2));
} else {
  console.log(`Scanned ${packages.length} installed packages.\n`);
  const rows = [...byLicense.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [license, list] of rows) {
    const flag = isAllowed(license) ? ' ' : '!';
    console.log(`${flag} ${String(list.length).padStart(4)}  ${license}`);
  }
  if (disallowed.length > 0) {
    console.log('\nPackages outside the permissive allow-list:');
    for (const pkg of disallowed) {
      console.log(`  - ${pkg.name}@${pkg.version}: ${pkg.license}`);
    }
  } else {
    console.log('\nAll packages are under permissive, MIT-compatible licenses.');
  }
}

process.exit(disallowed.length > 0 ? 1 : 0);
