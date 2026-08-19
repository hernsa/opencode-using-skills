# Execution: loading and following a skill

## Loading

Call the `skill` tool with the exact ID from the advertisement (e.g. `using-skills`).
On load, opencode:

1. Resolves the winning definition for that ID (see discovery.md for precedence)
2. Checks the `skill` permission for the selected agent (`allow` loads
   immediately, `ask` prompts the user, `deny` hides and rejects)
3. Adds the Markdown body — without frontmatter — to the conversation
4. Provides the skill's base directory and a sample of up to ten supporting
   file paths

## Recursion guard

`using-skills` and any other meta-skill apply once per session. After loading
one, do not load it again to satisfy its own instruction — that is the recursion
loop that stalls a conversation. A meta-skill governs until its guidance is
complete; it never needs re-invoking for subsequent turns.

## Supporting files are NOT auto-loaded

A skill directory may contain `references/` (load-on-demand documentation),
`scripts/` (executable helpers), and `assets/` (templates). Only the
`SKILL.md` body arrives in context. When the skill's instructions reference a
supporting file, read it explicitly before proceeding.

## Following exactly

- Announce what you're doing: "Using [skill] to [purpose]".
- If the skill has a checklist, create a todo per item and complete them in
  order.
- Follow the skill exactly. The steps exist because they encode accumulated
  judgment — improvising around them turns the skill into decoration.
- Progressive disclosure works both ways: the skill keeps `SKILL.md` short and
  pushes depth into references. When you hit a section that says "see
  references/X.md", go read it. Depth is where the real instructions live.

## When the skill is wrong for the situation

Stop. You are not obligated to finish a skill that does not fit. Say so
briefly, note which skill you considered, and proceed with the best approach.

## Permissions

If a skill is denied (`deny`), it is hidden from the advertisement entirely —
you will not see it to load it. If loading prompts the user (`ask`), surface
what the skill would do and why, so the approval is informed.