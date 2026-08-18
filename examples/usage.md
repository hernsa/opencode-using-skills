# Example triggers for the using-skills meta-skill

These are representative user requests and how the skill should guide the
agent. The exact skills referenced depend on what's installed — the point is
the *behavior*, not the names.

## "Let's build X" (new feature)

1. Check for skills: is there a brainstorming/design skill? Process skills
   come first — they set the approach.
2. Announce: "Using brainstorming to refine the idea before implementation."
3. Follow it exactly, one todo per checklist item.
4. Then let implementation skills carry the approved design out.

## "This test is failing" (bug)

1. Check for skills: debugging and systematic-problem-solving skills apply.
2. Announce and follow — repro first, hypothesis before fix.
3. Do not jump to edits before the process skill says to.

## "How do I use skill X?" (meta question)

1. Read the `<available_skills>` advertisement; locate skill X's description.
2. Answer with what it does and when it triggers, sourced from the
   description and, if needed, a direct read of its SKILL.md.
3. Load it if the user wants to run it.

## "Just answer this, it's simple" (red flag)

1. Recognize the rationalization: "This is just a simple question" is a red
   flag, not an argument.
2. Check for skills anyway; most questions that "need context first" have a
   skill that governs the investigation.
3. If genuinely no skill applies, answer directly — skills are force
   multipliers, not paperwork.

## "Fix this typo in my README" (no skill needed)

1. Check: no description matches a typo fix.
2. Skip skill loading, do the edit. Not every action needs a skill.