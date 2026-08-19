# opencode-using-skills

A meta-skill for [opencode](https://opencode.ai) that teaches any agent how to
work with agent skills — discover, select, load, and follow — regardless of
which skills are installed.

Think of it as the operator's manual for the `skill` tool itself. Where
skill-packs teach *what to do* (penetration testing, planning, debugging),
this skill teaches *how to use skills properly*: check before acting, match
intent against descriptions, let process skills set the approach, follow
checklists exactly, and never skip a skill that applies.

- **Skill-agnostic** — zero hardcoded skill names. Works with 5 skills or 900.
- **Zero config** — no scripts, no daemons, no state. Pure instructions.
- **Runtime discovery** — the agent reads its own `<available_skills>`
  advertisement each conversation, with a filesystem-scan fallback.
- **Cross-install** — global, project, or catalog install; same behavior.

## Install

### Option 1: copy into global skills (fastest)

```powershell
git clone https://github.com/hernsa/opencode-using-skills.git
Copy-Item -Recurse .\opencode-using-skills\skills\* ~\.config\opencode\skills\
```

### Option 2: add as a skill path

```powershell
git clone https://github.com/hernsa/opencode-using-skills.git ~\opencode-using-skills
```

Then in `~/.config/opencode/opencode.json` (or project `opencode.json`):

```json
{
  "skills": {
    "paths": ["~/opencode-using-skills/skills"]
  }
}
```

### Option 3: HTTP catalog (for managed fleets)

```json
{
  "skills": {
    "urls": ["https://raw.githubusercontent.com/hernsa/opencode-using-skills/main/"]
  }
}
```

The repo ships an `index.json` catalog manifest; opencode downloads the skill
files from it and caches them. Bump the `version` in `index.json` when files
change so clients refresh.

After any install, **restart opencode** — config and skills are loaded at
startup.

## Usage

No manual invocation needed — that's the point. `using-skills` is a meta-skill
that activates once when a conversation or task starts and governs how the agent
treats every other skill. It teaches:

1. **Discover** — read the `skill` tool's `<available_skills>` advertisement
   (fallback: scan `~/.config/opencode/skills`, `.opencode/skills`,
   `.claude/skills`, `.agents/skills`).
2. **Select** — match user intent against descriptions; process skills first.
3. **Load** — call the `skill` tool with the exact ID; read referenced files
   explicitly (they are not auto-loaded).
4. **Follow** — announce "Using [skill] to [purpose]", one todo per checklist
   item, follow exactly.

## How it works

```
skills/using-skills/
├── SKILL.md                    # the rule: check for a matching skill at task start
└── references/
    ├── discovery.md            # enumerating skills on any install
    ├── selection.md            # trigger matching, priority, red flags
    └── execution.md            # loading, checklists, progressive disclosure
```

The `SKILL.md` body stays short (~80 lines) by design — depth lives in
`references/` and loads on demand, so the meta-skill itself costs almost
nothing until it is needed.

## Repository layout

```
├── README.md
├── LICENSE                    # MIT
├── AGENTS.md                  # conventions for AI contributors
├── CONTRIBUTING.md
├── SECURITY.md
├── index.json                 # HTTP catalog manifest
├── skills/using-skills/       # the skill
├── scripts/validate-skills.mjs
├── examples/usage.md
└── .github/workflows/validate.yml
```

## Development

```bash
node scripts/validate-skills.mjs   # lints all SKILL.md files
```

The linter checks that every `SKILL.md` has valid frontmatter (required
`name` + `description`, kebab-case name matching its folder, optional
`license`/`compatibility`/`metadata`). CI runs it on every PR.

## License

MIT — see [LICENSE](LICENSE).