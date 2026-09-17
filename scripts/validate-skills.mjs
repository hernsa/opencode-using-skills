#!/usr/bin/env node
// Validates all skills in this repo: every SKILL.md must have valid
// frontmatter (required name + description), a kebab-case name that matches
// its directory, and an index.json catalog entry with a bumped version.
//
// Usage: node scripts/validate-skills.mjs
// Exit 0 on success, 1 on any failure.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, "skills");
const errors = [];
const warnings = [];

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function listSkillDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(dir, e.name));
}

function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

for (const dir of listSkillDirs(skillsDir)) {
  const name = basename(dir);
  const skillPath = join(dir, "SKILL.md");

  if (!existsSync(skillPath)) {
    errors.push(`${name}: missing SKILL.md`);
    continue;
  }

  const text = readFileSync(skillPath, "utf8");
  const fm = parseFrontmatter(text);
  if (!fm) {
    errors.push(`${name}: SKILL.md must start with YAML frontmatter`);
    continue;
  }

  if (!fm.name) errors.push(`${name}: frontmatter 'name' is required`);
  else if (!NAME_RE.test(fm.name))
    errors.push(`${name}: 'name' must be lowercase kebab-case (got '${fm.name}')`);
  else if (fm.name !== name)
    errors.push(`${name}: frontmatter name '${fm.name}' must match folder name '${name}'`);
  else if (fm.name.length > 64)
    errors.push(`${name}: 'name' exceeds 64 characters`);

  if (!fm.description)
    errors.push(`${name}: frontmatter 'description' is required`);
  else if (fm.description.length > 1024)
    errors.push(`${name}: 'description' exceeds 1024 characters`);
  else if (fm.description.length > 250)
    warnings.push(`${name}: description is ${fm.description.length} chars — keep under ~250 for trigger clarity`);

  const lines = text.split(/\r?\n/).length;
  if (lines > 150) warnings.push(`${name}: SKILL.md is ${lines} lines — prefer references/ for depth`);

  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  if (!body.trim()) errors.push(`${name}: SKILL.md body is empty`);

  // Recursion guard: a meta-skill must never demand invocation "before ANY
  // response" or "at the start of every response" — that phrasing makes the
  // skill re-trigger itself every turn and stalls the session.
  const recursiveTrigger =
    /before\s+(?:any|every)\s+response/i.test(`${fm.description}\n${body}`);
  if (recursiveTrigger)
    errors.push(
      `${name}: description/body contains a recursive trigger ('before ANY response') — this caused the infinite self-invocation bug; scope triggers to task/conversation start instead`
    );
}

// index.json catalog check
const indexPath = join(root, "skills", "index.json");
if (existsSync(indexPath)) {
  try {
    const index = JSON.parse(readFileSync(indexPath, "utf8"));
    const catalogNames = (index.skills ?? []).map((s) => s.name);
    for (const dir of listSkillDirs(skillsDir)) {
      const name = basename(dir);
      if (!catalogNames.includes(name))
        errors.push(`index.json: missing catalog entry for '${name}'`);
      const entry = (index.skills ?? []).find((s) => s.name === name);
      if (entry && typeof entry.version !== "number" && typeof entry.version !== "string")
        errors.push(`index.json: '${name}' must have a numeric or string 'version'`);
      if (entry && Array.isArray(entry.files))
        for (const f of entry.files)
          if (!existsSync(join(dir, f)))
            errors.push(`index.json: '${name}' lists missing file '${f}'`);
    }
  } catch (e) {
    errors.push(`index.json: invalid JSON (${e.message})`);
  }
} else {
  warnings.push("index.json not found — catalog installs will not work");
}

for (const w of warnings) console.log(`[warn] ${w}`);
for (const e of errors) console.error(`[error] ${e}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`\n✓ all skills valid (${warnings.length} warning(s))`);