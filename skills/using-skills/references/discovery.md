# Discovery: finding what skills exist on this install

Skills are advertised to the agent through the `skill` tool. There is no central
registry — each opencode install has its own set, and it can change between
projects. Always re-discover rather than assume.

## Primary: the skill tool description

At every model step, opencode advertises permitted skills that have a
description and do not set `opencode/autoinvoke` to `false`. The advertisement
looks like this inside the `skill` tool's description:

```text
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>
```

The advertisement contains only each skill's ID, name, and description — it
does not include skill bodies. The body loads only when you call the `skill`
tool with the exact ID.

## Fallback: scan the filesystem

If the `skill` tool is hidden (disabled in config or permissions) or you need
more detail than the advertisement gives, scan for `SKILL.md` files directly:

| Scope | Path |
|-------|------|
| Global | `~/.config/opencode/skills/<name>/SKILL.md` |
| Global compatibility | `~/.claude/skills/<name>/SKILL.md`, `~/.agents/skills/<name>/SKILL.md` |
| Project | `.opencode/skills/<name>/SKILL.md` |
| Project compatibility | `.claude/skills/<name>/SKILL.md`, `.agents/skills/<name>/SKILL.md` |
| Extra | Any path listed in `skills.paths` of `opencode.json` / `opencode.jsonc` |

Project paths are searched upward from the current working directory to the
project root. Within each source directory, skills are discovered as
`skills/<name>/SKILL.md` (directory form, recommended).

## Reading a skill before loading it

To judge whether a skill applies, read its frontmatter `description` — that is
the contract used for model-facing discovery. The body may be long; the
description is always short.

If multiple sources define the same skill ID, the later source in precedence
order wins: built-ins, then `.claude/skills`, `.agents/skills`,
`~/.config/opencode/skills`, project `.opencode/skills`, then explicit `skills`
config entries.