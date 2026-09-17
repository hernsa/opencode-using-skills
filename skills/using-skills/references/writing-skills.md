# Writing skills: how to author skills that agents actually use

This guide is for humans (and agents) creating new skills for opencode. The goal: skills that trigger reliably, read cleanly, and pass validation.

---

## 1. Frontmatter

```yaml
---
name: kebab-case-name
description: Trigger-oriented summary — what the skill does AND when to use it
license: MIT
compatibility: opencode
metadata:
  audience: agents
  category: meta|process|implementation
---
```

| Field | Rule |
|-------|------|
| `name` | 1–64 chars, lowercase, single hyphens, matches folder name |
| `description` | 1–250 chars for trigger clarity (validator warns >250); front-load keywords users say |
| `license` | MIT unless different |
| `compatibility` | `opencode` (required for catalog) |
| `metadata.audience` | `agents` (always) |
| `metadata.category` | `meta` (governs workflow), `process` (sets approach), or `implementation` (carries it out) |

**Bad description:** "Git release helper"
**Good description:** "Create consistent releases and changelogs from merged PRs — use when preparing a tagged release"

---

## 2. Body structure

```
# Skill: human-readable-name

## What I do
- Bullet 1: concrete action
- Bullet 2: another action

## When to use me
Use this when [specific trigger condition].
Ask clarifying questions if [ambiguity condition].

## How I work
1. Step one
2. Step two

## Red flags / common mistakes
- Don't do X
- Do Y instead

## References
See `references/deep-dive.md` for advanced usage.
```

Keep `SKILL.md` under 150 lines. Push depth to `references/`.

---

## 3. Trigger-oriented descriptions (the most important part)

The description is what agents match against user intent. It must contain words users actually say.

| Weak (matches nothing) | Strong (matches user words) |
|------------------------|-----------------------------|
| "Database helper" | "Run SQL queries, inspect schema, debug migrations" |
| "Test utility" | "Run pytest, generate coverage, debug failing tests" |
| "API checker" | "Test REST endpoints, validate OpenAPI spec, find auth bugs" |
| "Config validator" | "Check opencode.json, .opencode/ files, fix schema errors" |

**Pattern:** `[verb] [what user wants] — use when [trigger condition]`

---

## 4. Full advertisement format (what agents see)

```text
<available_skills>
  <skill>
    <name>using-skills</name>
    <description>Use when starting a conversation or new task to find matching skills — teaches discover, select, load, follow on any opencode install. Once per session; never re-invoke.</description>
  </skill>
  <skill>
    <name>brainstorming</name>
    <description>Explore ideas, clarify requirements, propose designs before implementation — use for new features, vague requests, architectural decisions.</description>
  </skill>
  <skill>
    <name>systematic-debugging</name>
    <description>Diagnose bugs, test failures, unexpected behavior before proposing fixes — use for crashes, flaky tests, performance regressions.</description>
  </skill>
  <skill>
    <name>code-security-auditor</name>
    <description>Pre-execution security audit of untrusted codebases — use when analyzing a project for malicious behavior, supply chain risks, or vulnerabilities before running.</description>
  </skill>
</available_skills>
```

Agents read this every turn. Each skill gets one line. Descriptions with the user's literal words win.

---

## 4. Process vs Implementation skills

| Process skills (run first) | Implementation skills (run after) |
|----------------------------|-----------------------------------|
| `brainstorming` — explore ideas, clarify scope | `lean-build` — build feature with strict scope |
| `systematic-debugging` — diagnose root cause | `surgical-patch` — fix narrow bug |
| `writing-plans` — create implementation plan | `executing-plans` — run the plan |
| `receiving-code-review` — evaluate feedback | `verification-before-completion` — prove fix works |
| `using-skills` (meta) — governs workflow | — |

**Rule:** Process skills set the approach; implementation skills carry it out. When multiple apply, run process first.

---

## 5. Permission system (`allow` / `ask` / `deny`)

Configured in `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "dangerous-*": "ask",
      "internal-*": "deny"
    }
  }
}
```

| Value | Behavior |
|-------|----------|
| `allow` | Loads immediately, no prompt |
| `ask` | Prompts user; agent explains what skill does and why |
| `deny` | Hidden from advertisement entirely — agent never sees it |

**For skill authors:** Assume `allow` by default. Don't rely on `ask`/`deny` for security — those are user controls.

---

## 6. `autoinvoke: false`

Frontmatter field (optional):

```yaml
---
name: my-skill
description: ...
autoinvoke: false
---
```

When `true` (default): skill appears in `<available_skills>` every turn if description matches.

When `false`: skill never auto-advertises. Agent must be explicitly told to load it, or user must invoke it manually.

**Use `autoinvoke: false` for:**
- Skills that should only run on explicit user request
- Internal/admin skills not meant for general use
- Skills with side effects (e.g., "deploy to prod")

---

## 7. Duplicate ID precedence (concrete example)

Sources checked in order (later wins):

1. Built-in skills (shipped with opencode)
2. `~/.claude/skills/<name>/SKILL.md`
3. `~/.agents/skills/<name>/SKILL.md`
4. `~/.config/opencode/skills/<name>/SKILL.md`
5. Project `.opencode/skills/<name>/SKILL.md`
6. Paths in `skills.paths` config

**Example:** You have `brainstorming` in `~/.config/opencode/skills/` (global) AND in `.opencode/skills/` (project). The project version wins because it's checked later (step 5 vs step 4). Validator warns on duplicate names.

---

## 8. Catalog entry (`index.json`)

```json
{
  "skills": [
    {
      "name": "my-skill",
      "version": "2",
      "files": [
        "SKILL.md",
        "references/usage.md",
        "references/advanced.md",
        "scripts/helper.mjs"
      ]
    }
  ]
}
```

Rules (enforced by validator):
- `version`: non-empty string (e.g., `"2"`, not `2`)
- `files`: non-empty string paths; must include `SKILL.md`; no duplicates; no traversal (`../`), absolute, backslash, or URL-encoded paths; all files must exist on disk
- Bump `version` string when any file changes so clients refresh

---

## 9. Common mistakes checklist

- [ ] Description >250 chars (warning)
- [ ] `name` doesn't match folder
- [ ] `version` is a number, not string
- [ ] `files` missing `SKILL.md`
- [ ] `files` lists non-existent file
- [ ] `files` has duplicate paths
- [ ] Body empty after frontmatter
- [ ] Frontmatter missing or malformed YAML
- [ ] Description doesn't contain trigger keywords
- [ ] Hardcoded skill name in body (use "the advertised skill ID")
- [ ] SKILL.md >150 lines (move to references/)
- [ ] No "see references/X.md" anchors in SKILL.md sections
- [ ] `config skills array` instead of `skills.paths`
- [ ] Claims flat `skills/<name>.md` form (only directory form exists)

---

## 10. Minimal valid skill example

**Folder:** `skills/my-skill/`

`SKILL.md`:
```markdown
---
name: my-skill
description: Lint TypeScript files with strict rules — use when code needs type-checking before commit
license: MIT
compatibility: opencode
metadata:
  audience: agents
  category: implementation
---
# Skill: TypeScript Linter

## What I do
- Run tsc --noEmit on changed files
- Report type errors with file:line
- Suggest fixes for common patterns

## When to use me
Use this when you've made TypeScript changes and need to verify types before committing.
Ask clarifying questions if tsconfig.json is missing.

## How I work
1. Find tsconfig.json (walk up from cwd)
2. Run tsc --noEmit --project <config>
3. Parse and format errors

## Red flags
- Don't skip linting because "it's a small change"
- Don't ignore errors — fix or suppress with comment

## References
See `references/tsconfig-patterns.md` for common configs.
```

`references/tsconfig-patterns.md`:
```markdown
# TypeScript config patterns

## Strict mode (recommended)
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## Monorepo with project references
```json
{
  "references": [{ "path": "./packages/*" }]
}
```
```

This skill passes validation, triggers on "lint", "typescript", "type-check", "tsc", and teaches the agent exactly what to do.