---
name: using-skills
description: Use when starting a conversation or new task to decide whether an applicable skill exists - teaches how to discover, select, load, and follow agent skills on any opencode install. Applies once per session; never re-invoke it to satisfy its own rule.
license: MIT
compatibility: opencode
metadata:
  audience: agents
  category: meta
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<RECURSION-GUARD>
`using-skills` governs once per session. Never invoke it — or any already-loaded
meta-skill — to satisfy its own instruction. Re-invoking a loaded meta-skill is
the recursion bug that stalls sessions. If no concrete skill matches the task,
proceed without invoking anything.
</RECURSION-GUARD>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a concrete skill might apply to the task
at hand, invoke it.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## The Rule

**Check for a matching skill at the start of a conversation or a new task** —
including before clarifying questions, exploring the codebase, or checking
files. Invoke the skill that matches before the work that needs it.

This skill applies ONCE per session. If you are already following it, you are
already compliant — do not re-invoke it to start another turn.

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
| "I already loaded using-skills, load it again" | It applies once per session — re-invoking it is the recursion bug. |

## User Instructions

User instructions (CLAUDE.md, AGENTS.md, GEMINI.md, etc, direct requests) take precedence over skills, which in turn override default behavior. Only skip skill workflows or instructions when your human partner has explicitly told you to.