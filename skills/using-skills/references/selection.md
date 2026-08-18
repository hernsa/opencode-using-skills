# Selection: choosing the right skill

A skill set can be tiny (a handful of personal skills) or enormous (hundreds of
playbooks). Selection discipline stays the same: match intent, not names.

## Trigger matching

- Read each skill's `description` and match it against the user's actual
  intent, not against the skill's name. Names are unstable; descriptions are
  written to trigger.
- Front-load literal keywords or filenames the user said. A description that
  contains the user's words is a strong signal.
- Watch for "Use ONLY when..." gates in descriptions — those skills should stay
  quiet on adjacent topics.

## Priority when multiple skills apply

1. **Process skills first** — they set the approach (brainstorming before
   building, debugging before fixing, planning before implementing).
2. Then implementation skills carry the approach out.
3. If two skills genuinely compete for the same job, pick the more specific
   one. When still ambiguous, state your choice and proceed — don't stall.

## When NOT to use a skill

- No skill description matches the task. Do the work directly.
- The user explicitly told you to skip skill workflows (user instructions
   take precedence over skills).
- You are a subagent executing a specific task — the skill it was dispatched
   with governs; its own SUBAGENT-STOP guard handles this.
- A skill was loaded and turned out wrong for the situation. Stop using it.
   Loading a skill is not a contract to finish it.

## Over-triggering vs under-triggering

| Failure | Symptom | Cause |
|---------|---------|-------|
| Over-triggering | Skill fires for wrong tasks | Description too broad, or you're matching names instead of descriptions |
| Under-triggering | Skill never fires when it should | Description missing trigger keywords, or you're "just doing the thing" instead of checking |

Both are selection failures. When you notice either, adjust your matching — do
not force-load a skill to be safe, and do not skip one to be fast.