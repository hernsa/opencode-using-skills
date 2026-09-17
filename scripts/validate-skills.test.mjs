import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, symlinkSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const markdown = (name = "sample", description = "Use for testing.") =>
  `---\nname: ${name}\ndescription: ${description}\n---\nRead the instructions.\n`;
const entry = (name = "sample") => ({ name, version: "release-candidate", files: ["SKILL.md"] });

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "validator-test-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "scripts"));
  mkdirSync(join(dir, "skills", "sample"), { recursive: true });
  copyFileSync(join(root, "scripts", "validate-skills.mjs"), join(dir, "scripts", "validate-skills.mjs"));
  symlinkSync(join(root, "node_modules"), join(dir, "node_modules"), "junction");
  const write = (relPath, text) => writeFileSync(join(dir, relPath), text);
  const catalog = (value) => write("skills/index.json", JSON.stringify(value));
  write("skills/sample/SKILL.md", markdown());
  catalog({ skills: [entry()] });
  return {
    dir,
    write,
    catalog,
    run() {
      const result = spawnSync(process.execPath, [join(dir, "scripts", "validate-skills.mjs")], {
        encoding: "utf8",
        timeout: 10000,
      });
      assert.ifError(result.error);
      return { status: result.status, output: result.stdout + result.stderr };
    },
  };
}

test("clean fixture passes", (t) => {
  const fx = fixture(t);
  const { status, output } = fx.run();
  assert.equal(status, 0, output);
});

test("65-char name matching folder fails", (t) => {
  const fx = fixture(t);
  const name = "a".repeat(65);
  mkdirSync(join(fx.dir, "skills", name));
  fx.write(`skills/${name}/SKILL.md`, markdown(name));
  fx.catalog({ skills: [entry(name)] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /exceeds 64 characters/);
});

test("malformed YAML frontmatter fails", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: sample\ndescription: [unclosed\n---\nBody text here.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /Flow sequence|frontmatter/i);
});

test("duplicate YAML keys fail", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: sample\nname: sample\ndescription: dup keys\n---\nBody text.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("typed frontmatter values fail", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: 123\ndescription: null\n---\nBody text.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /must be a string/);
});

test("block and quoted descriptions parse", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    '---\nname: sample\ndescription: >-\n  Use when wiring\n  A to B.\n---\nBody text.\n'
  );
  const { status: quotedStatus, output: quotedOutput } = fx.run();
  assert.equal(quotedStatus, 0, quotedOutput);
});

test("EOF-closing fence parses but empty body errors", (t) => {
  const fx = fixture(t);
  fx.write("skills/sample/SKILL.md", "---\nname: sample\ndescription: t\n---\n");
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /body is empty/);
});

test("ghost catalog entry fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [entry(), entry("ghost-skill")] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("duplicate catalog names fail", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [entry(), entry()] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("integer version fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), version: 2 }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("nonpositive version fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), version: 0 }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("version-positive fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), version: "" }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("missing version fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ name: "sample", files: ["SKILL.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("missing files array fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ name: "sample", version: "v1" }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("empty files array fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: [] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("missing SKILL.md in files fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: ["NOTES.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("duplicate file paths fail", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: ["SKILL.md", "SKILL.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("path traversal fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: ["../sample/SKILL.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("absolute file path fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: [join(fx.dir, "SKILL.md")] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("backslash file path fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: ["references\\x.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("URL-encoded file path fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), files: ["SKILL%2Emd"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("symlinked SKILL.md outside root fails", (t) => {
  const fx = fixture(t);
  const outside = join(fx.dir, "outside.md");
  writeFileSync(outside, markdown());
  rmSync(join(fx.dir, "skills", "sample", "SKILL.md"));
  let linked = true;
  try {
    symlinkSync(outside, join(fx.dir, "skills", "sample", "SKILL.md"), "file");
  } catch {
    linked = false;
  }
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  if (linked) assert.match(output, /not a regular file|missing file/);
});

test("missing catalog fails", (t) => {
  const fx = fixture(t);
  rmSync(join(fx.dir, "skills", "index.json"));
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("skills dir absent fails", (t) => {
  const fx = fixture(t);
  rmSync(join(fx.dir, "skills"), { recursive: true, force: true });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("broken JSON syntax distinct from schema error", (t) => {
  const fx = fixture(t);
  writeFileSync(join(fx.dir, "skills", "index.json"), "{ skills: ");
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /invalid JSON/);
});

test("null JSON root fails validation", (t) => {
  const fx = fixture(t);
  writeFileSync(join(fx.dir, "skills", "index.json"), "null");
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /skills directory contains no skill folders|index\.json/);
});

test("false JSON root fails validation", (t) => {
  const fx = fixture(t);
  writeFileSync(join(fx.dir, "skills", "index.json"), "false");
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /skills directory contains no skill folders|index\.json/);
});

test("array JSON root fails validation", (t) => {
  const fx = fixture(t);
  fx.catalog([entry()]);
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
});

test("null entry in skills array fails without crash", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [entry(), null] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /string 'name'/);
});

test("string entry in skills array fails without crash", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [entry(), "sample"] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /string 'name'/);
});

test("catalog without SKILL.md in files fails", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ name: "sample", version: "v1", files: ["NOTES.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /must include 'SKILL\.md' in files/);
});

test("empty skills dir with valid catalog still fails", (t) => {
  const fx = fixture(t);
  rmSync(join(fx.dir, "skills", "sample"), { recursive: true, force: true });
  fx.catalog({ skills: [] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /no skill folders/);
});

test("license and compatibility as non-strings fail", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: sample\ndescription: d\nlicense: [MIT]\ncompatibility: opencode\n---\nBody text.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /'license' must be a string/);
});

test("metadata non-string value fails", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: sample\ndescription: d\nmetadata:\n  category: meta\n  depth: 3\n---\nBody text.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /metadata 'depth' must be a string/);
});

test("metadata as non-mapping fails", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: sample\ndescription: d\nmetadata: [a, b]\n---\nBody text.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /'metadata' must be a mapping/);
});

test("unknown frontmatter fields ignored", (t) => {
  const fx = fixture(t);
  fx.write(
    "skills/sample/SKILL.md",
    "---\nname: sample\ndescription: d\nfuture_field:\n  nested: [x]\n  deep: {a: 1}\n---\nBody text.\n"
  );
  const { status, output } = fx.run();
  assert.equal(status, 0, output);
});

test("EOF-closing fence with no trailing newline and no body fails", (t) => {
  const fx = fixture(t);
  fx.write("skills/sample/SKILL.md", "---\nname: sample\ndescription: t\n---");
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /body is empty/);
});

test("catalog file symlink into sibling skill dir fails containment", (t) => {
  const fx = fixture(t);
  const sibling = join(fx.dir, "skills", "other-skill");
  mkdirSync(sibling);
  writeFileSync(join(sibling, "SKILL.md"), markdown("other-skill"));
  const outside = join(sibling, "secret.md");
  writeFileSync(outside, "hidden");
  const target = join(fx.dir, "skills", "sample", "NOTES.md");
  try {
    symlinkSync(outside, target, "file");
  } catch {
    return t.skip("symlinks unavailable");
  }
  fx.catalog({ skills: [entry(), entry("other-skill")] });
  fx.catalog({
    skills: [
      { ...entry(), files: ["SKILL.md", "NOTES.md"] },
      entry("other-skill"),
    ],
  });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /resolves outside skills root/);
});

test("catalog file symlink escaping skill dir fails", (t) => {
  const fx = fixture(t);
  const outside = join(fx.dir, "outside.md");
  writeFileSync(outside, "leaked");
  const target = join(fx.dir, "skills", "sample", "NOTES.md");
  try {
    symlinkSync(outside, target, "file");
  } catch {
    return t.skip("symlinks unavailable");
  }
  fx.catalog({ skills: [{ ...entry(), files: ["SKILL.md", "NOTES.md"] }] });
  const { status, output } = fx.run();
  assert.equal(status, 1, output);
  assert.match(output, /resolves outside skills root/);
});

test("opaque string version accepted", (t) => {
  const fx = fixture(t);
  fx.catalog({ skills: [{ ...entry(), version: "2.0.0-rc.1+build.7" }] });
  const { status, output } = fx.run();
  assert.equal(status, 0, output);
});


