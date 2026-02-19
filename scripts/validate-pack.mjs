#!/usr/bin/env node
/**
 * validate-pack.mjs
 * Runs `npm pack --dry-run --json`, inspects the output, and enforces:
 *   - No forbidden files are included
 *   - All required files are present
 *   - Total pack size < 2 MB
 */

import { execSync } from 'node:child_process';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const FORBIDDEN_PATTERNS = [
  /^node_modules\//,
  /^\.env$/,
  /^\.env\./,
  /^credentials\.json$/,
  /\.secret$/,
];

const REQUIRED_PREFIXES = [
  'dist/',
  'templates/',
  'README.md',
  'CHANGELOG.md',
  'LICENSE',
  'package.json',
];

let failed = false;

function fail(msg) {
  console.error(`  ✗ ${msg}`);
  failed = true;
}

function pass(msg) {
  console.log(`  ✓ ${msg}`);
}

// ---------- run npm pack --dry-run --json ----------
let packOutput;
try {
  packOutput = execSync('npm pack --dry-run --json', { encoding: 'utf8' });
} catch (err) {
  console.error('ERROR: npm pack --dry-run failed:\n', err.message);
  process.exit(1);
}

let packData;
try {
  packData = JSON.parse(packOutput);
} catch {
  console.error('ERROR: Could not parse npm pack JSON output.');
  process.exit(1);
}

// npm pack --json returns an array; take first element
const entry = Array.isArray(packData) ? packData[0] : packData;
const files = /** @type {{ path: string; size: number }[]} */ (entry.files ?? []);
const totalSize = entry.unpackedSize ?? files.reduce((s, f) => s + (f.size ?? 0), 0);

console.log(`\nPackage: ${entry.name}@${entry.version}`);
console.log(`Files:   ${files.length}`);
console.log(`Size:    ${(totalSize / 1024).toFixed(1)} KB (limit: ${MAX_SIZE_BYTES / 1024} KB)\n`);

// ---------- check forbidden files ----------
console.log('Checking for forbidden files…');
let foundForbidden = false;
for (const file of files) {
  const p = file.path;
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(p)) {
      fail(`Forbidden file in package: ${p}`);
      foundForbidden = true;
    }
  }
}
if (!foundForbidden) {
  pass('No forbidden files found');
}

// ---------- check required files ----------
console.log('\nChecking for required files…');
for (const required of REQUIRED_PREFIXES) {
  const present = files.some(f => f.path === required || f.path.startsWith(required));
  if (present) {
    pass(`Required entry present: ${required}`);
  } else {
    fail(`Required entry missing from package: ${required}`);
  }
}

// ---------- check size ----------
console.log('\nChecking pack size…');
if (totalSize < MAX_SIZE_BYTES) {
  pass(`Pack size ${(totalSize / 1024).toFixed(1)} KB < ${(MAX_SIZE_BYTES / 1024).toFixed(0)} KB`);
} else {
  fail(`Pack size ${(totalSize / 1024).toFixed(1)} KB exceeds limit of ${(MAX_SIZE_BYTES / 1024).toFixed(0)} KB`);
}

// ---------- result ----------
console.log('');
if (failed) {
  console.error('validate:pack FAILED — fix the issues above before publishing.\n');
  process.exit(1);
} else {
  console.log('validate:pack PASSED — package is ready to publish.\n');
  process.exit(0);
}
