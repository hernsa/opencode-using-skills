#!/usr/bin/env node
// Validates all skills in this repo: every SKILL.md must have valid
// frontmatter (required name + description), a kebab-case name that matches
// its directory, and an index.json catalog entry with a bumped version.
//
// Usage: node scripts/validate-skills.mjs
// Exit 0 on success, 1 on any failure.

import { readdirSync, readFileSync, existsSync, statSync, realpathSync } from "node:fs";
import { join, dirname, basename, isAbsolute, relative, sep, win32 } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, "skills");
const errors = [];
const warnings = [];

const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function listSkillDirs(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => {
        if (e.isSymbolicLink()) errors.push(`${e.name}: linked skill entries are not supported`);
        return e.isDirectory();
      })
      .map((e) => join(dir, e.name));
  } catch {
    errors.push("skills directory cannot be read");
    return [];
  }
}

const skillDirs = listSkillDirs(skillsDir);
const skillDirNames = new Set(skillDirs.map((d) => basename(d)));

function parseFrontmatter(text, name) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!m) return null;
  try {
    const fm = parse(m[1]);
    if (fm === null || typeof fm !== "object" || Array.isArray(fm))
      return { __error: "frontmatter must be a YAML mapping" };
    for (const key of ["name", "description", "license", "compatibility"]) {
      if (fm[key] !== undefined && typeof fm[key] !== "string")
        return { __error: `frontmatter '${key}' must be a string` };
    }
    if (fm.metadata !== undefined) {
      if (typeof fm.metadata !== "object" || fm.metadata === null || Array.isArray(fm.metadata))
        return { __error: "frontmatter 'metadata' must be a mapping" };
      for (const [k, v] of Object.entries(fm.metadata)) {
        if (typeof v !== "string")
          return { __error: `frontmatter metadata '${k}' must be a string` };
      }
    }
    return fm;
  } catch (e) {
    return { __error: e.message.split("\n")[0] };
  }
}

for (const dir of skillDirs) {
  const name = basename(dir);
  const skillPath = join(dir, "SKILL.md");

  if (!existsSync(skillPath)) {
    errors.push(`${name}: missing SKILL.md`);
    continue;
  }

  const text = readFileSync(skillPath, "utf8");
  const parsed = parseFrontmatter(text, name);
  if (!parsed) {
    errors.push(`${name}: SKILL.md must start with YAML frontmatter`);
    continue;
  }
  if (parsed.__error) {
    errors.push(`${name}: ${parsed.__error}`);
    continue;
  }
  const fm = parsed;

  if (typeof fm.name !== "string" || !fm.name)
    errors.push(`${name}: frontmatter 'name' is required`);
  else if (typeof fm.name !== "string" || !NAME_RE.test(fm.name))
    errors.push(`${name}: 'name' must be lowercase kebab-case (got '${fm.name}')`);
  else if (fm.name !== name)
    errors.push(`${name}: frontmatter name '${fm.name}' must match folder name '${name}'`);
  else if (fm.name.length > 64)
    errors.push(`${name}: 'name' exceeds 64 characters`);

  if (typeof fm.description !== "string" || !fm.description)
    errors.push(`${name}: frontmatter 'description' is required`);
  else if (fm.description.length > 1024)
    errors.push(`${name}: 'description' exceeds 1024 characters`);
  else if (fm.description.length > 250)
    warnings.push(`${name}: description is ${fm.description.length} chars — keep under ~250 for trigger clarity`);

  const lines = text.split(/\r?\n/).length;
  if (lines > 150) warnings.push(`${name}: SKILL.md is ${lines} lines — prefer references/ for depth`);

  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
  if (!body.trim()) errors.push(`${name}: SKILL.md body is empty`);

  // Recursion guard: a meta-skill must never demand invocation "before ANY
  // response" or "at the start of every response" — that phrasing makes the
  // skill re-trigger itself every turn and stalls the session.
  const recursiveTrigger =
    /\b(?:before|at\s+the\s+(?:start|beginning)\s+of|on)\s+(?:any|every|each)\s+response\b/i.test(
      `${typeof fm.description === "string" ? fm.description : ""}\n${body}`
    );
  if (recursiveTrigger)
    errors.push(
      `${name}: description/body contains a recursive trigger ('before ANY response') — this caused the infinite self-invocation bug; scope triggers to task/conversation start instead`
    );
}

if (skillDirs.length === 0)
  errors.push("skills directory contains no skill folders");

function isPathInside(child, parent) {
  const rel = relative(parent, child);
  return rel === "" || (rel !== "" && !rel.startsWith("..") && !isAbsolute(rel));
}

// index.json catalog check
const indexPath = join(root, "skills", "index.json");
if (existsSync(indexPath)) {
  let index = null;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf8"));
  } catch (e) {
    errors.push(`index.json: invalid JSON (${e.message})`);
  }
  if (index !== null && typeof index === "object" && !Array.isArray(index)) {
    const entries = index.skills ?? [];
    if (!Array.isArray(entries)) {
      errors.push("index.json: 'skills' must be an array");
    } else {
      const seen = new Set();
      for (const e of entries) {
        const name = e?.name;
        if (typeof name !== "string" || !name) {
          errors.push("index.json: every entry must have a string 'name'");
          continue;
        }
        if (seen.has(name)) errors.push(`index.json: duplicate catalog entry for '${name}'`);
        seen.add(name);
        if (!NAME_RE.test(name)) errors.push(`index.json: catalog name '${name}' must be lowercase kebab-case`);
        if (!skillDirNames.has(name))
          errors.push(`index.json: ghost catalog entry for '${name}' (no such skill directory)`);
        if (typeof e.version !== "string" || e.version.trim() === "")
          errors.push(`index.json: '${name}' must have a nonempty string 'version'`);
        if (!Array.isArray(e.files)) {
          errors.push(`index.json: '${name}' must list a 'files' array`);
          continue;
        }
        if (!e.files.includes("SKILL.md"))
          errors.push(`index.json: '${name}' entry must include 'SKILL.md' in files`);
        if (e.files.length === 0) errors.push(`index.json: '${name}' files array must not be empty`);
        const fileSeen = new Set();
        for (const f of e.files) {
          if (typeof f !== "string" || f === "") {
            errors.push(`index.json: '${name}' files must be nonempty strings`);
            continue;
          }
          if (fileSeen.has(f)) errors.push(`index.json: '${name}' lists duplicate file '${f}'`);
          fileSeen.add(f);
          if (isAbsolute(f) || f.includes("\\") || f.includes("..") || /%[0-9a-f]{2}/i.test(f))
            errors.push(`index.json: '${name}' has unsafe file path '${f}'`);
        }
      }
      const catalogNames = [...seen];
      for (const [name, dir] of skillDirs.map((d) => [basename(d), d])) {
        if (!catalogNames.includes(name))
          errors.push(`index.json: missing catalog entry for '${name}'`);
        const entry = entries.find((s) => s?.name === name);
        if (entry && Array.isArray(entry.files)) {
          for (const f of entry.files) {
            if (typeof f !== "string") continue;
            const target = join(dir, f);
            try {
              const st = statSync(target);
              if (!st.isFile()) errors.push(`index.json: '${name}' file '${f}' is not a regular file`);
              else if (!isPathInside(realpathSync(target), realpathSync(dir)))
                errors.push(`index.json: '${name}' file '${f}' resolves outside skills root`);
            } catch {
              errors.push(`index.json: '${name}' lists missing file '${f}'`);
            }
          }
        }
      }
    }
  } else if (existsSync(indexPath)) {
    errors.push("index.json: root must be a JSON object");
  }
} else {
  errors.push("index.json not found — catalog installs will not work");
}

for (const w of warnings) console.log(`[warn] ${w}`);
for (const e of errors) console.error(`[error] ${e}`);

if (errors.length) {
  console.error(`\n✗ ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`\n✓ all skills valid (${warnings.length} warning(s))`);