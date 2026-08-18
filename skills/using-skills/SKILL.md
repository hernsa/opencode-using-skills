---
name: using-skills
description: Use when starting any conversation or before any response - establishes how to discover, select, load, and follow agent skills, requiring skill invocation before ANY response. Works with any skill set on any opencode install.
license: MIT
compatibility: opencode
metadata:
  audience: agents
  category: meta
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Invoke relevant or requested skills BEFORE any response or action** — including clarifying questions, exploring the codebase, or checking files. If it turns out wrong for the situation, you don't have to use it.

Then announce "Using [skill] to [purpose]" and follow the skill exactly. If it has a checklist, create a todo per item.

## 1. Discover what skills exist

Every opencode session advertises its available skills in the `skill` tool's description as `<available_skills>` entries — ID, name, and description. That list is your ground truth for this install. Read it before acting.

If the `skill` tool is hidden or disabled, fall back to scanning skill directories directly:

- `~/.config/opencode/skills/**/SKILL.md` (global)
- `.opencode/skills/**/SKILL.md`, `.claude/skills/**/SKILL.md`, `.agents/skills/**/SKILL.md` (project)
- Any extra paths listed in the config `skills` array

## 2. Select the right skill

- Match the user's intent against each skill's `description` — front-load literal keywords the user actually said.
- When multiple skills apply, **process skills come first**: they set the approach, then implementation skills carry it out.
- If no skill clearly applies, do the work directly. Skills are force multipliers, not paperwork.

## 3. Load and follow

- Call the `skill` tool with the exact skill ID. The body loads into the conversation; supporting files in `references/` and `scripts/` do NOT auto-load — read them when the skill tells you to.
- Follow the skill exactly. If it has a checklist, create a todo per item. Don't skip steps, don't improvise around them.
- If a skill turns out wrong for the situation, stop using it — you don't have to finish it.

## Red Flags

These thoughts mean STOP — you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.