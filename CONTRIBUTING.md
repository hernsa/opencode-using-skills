# Contributing

Thanks for contributing to `opencode-using-skills`.

## What fits here

This repo ships exactly one skill: `using-skills`. Changes should make that
skill better at teaching agents how to use skills — sharper triggers, clearer
instructions, better references, more robust packaging.

A skill does not fit here if it teaches a *domain* (security, testing, design)
rather than the *meta-skill* of using skills. Keep those in their own
skill-packs.

## Getting started

1. Fork the repo and clone your fork.
2. Make your change.
3. Run the validator: `node scripts/validate-skills.mjs`
4. If you changed skill files, bump `version` in `skills/index.json`.
5. Commit with a clear message, push, and open a PR.

## Style

- Keep `SKILL.md` under 150 lines. Move depth to `references/`.
- Descriptions must be trigger-oriented: what the skill does AND when to use
  it, with literal keywords users/agents are likely to say.
- Prefer concrete instructions over philosophy. Every line should tell the
  agent what to do.
- Match existing tone: direct, terse, no fluff.

## PR checklist

- [ ] `node scripts/validate-skills.mjs` passes
- [ ] `skills/index.json` version bumped if skill files changed
- [ ] README updated if install/usage changed
- [ ] Changes are scoped to the `using-skills` skill or its packaging

## Reporting issues

Open an issue with a clear title, the opencode version, your skill set, and
what you expected versus what happened.