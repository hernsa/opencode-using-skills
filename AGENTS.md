# AGENTS.md

This file governs how AI agents (opencode, Claude Code, Codex, etc.) work in
this repository.

## Scope

This repo contains exactly one skill, `using-skills`, plus its packaging
(README, catalog manifest, linter, CI). Do not add second skills here — that
would dilute the repo's single purpose.

## Conventions

- One skill per folder: `skills/<name>/SKILL.md`. The directory name and the
  frontmatter `name` must match, kebab-case, lowercase alphanumeric with single
  hyphen separators.
- `SKILL.md` frontmatter requires `name` and `description`. Keep the
  description front-loaded with trigger keywords and under ~250 characters.
- Keep `SKILL.md` bodies short (< 150 lines). Push depth into
  `references/*.md`, loaded on demand.
- Every change to a skill's files must bump the `version` in `skills/index.json` so
  catalog installs refresh.
- Run `node scripts/validate-skills.mjs` before committing. All files in the
  repo must pass.
- Use relative paths from the skill directory when referencing skill files.

## Quality bar

- No hardcoded skill names inside `SKILL.md` or references — this skill must
  stay generic across any opencode install.
- No hypophora, no filler. Instructions must be actionable and specific.
- User instructions (this file, README, direct requests) take precedence over
  the skill's own guidance.

## Commands

```bash
node scripts/validate-skills.mjs   # validate all skills (exit 1 on failure)
```