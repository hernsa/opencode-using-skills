#!/usr/bin/env node
import { readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { join, dirname, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const baseDir = join(root, "skills");
const failures = [];

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "");
  const target = join(baseDir, rel);
  if (target !== baseDir && !target.startsWith(baseDir + sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  readFile(target)
    .then((data) => {
      res.writeHead(200);
      res.end(data);
    })
    .catch(() => {
      res.writeHead(404);
      res.end();
    });
});

function fetchOk(url) {
  return fetch(url).then((res) => {
    if (res.status !== 200) failures.push(`GET ${url} -> ${res.status}`);
    return res.json().catch(() => null);
  });
}

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}/`;

try {
  const manifest = await fetchOk(`${base}index.json`);
  if (!manifest || !Array.isArray(manifest.skills)) {
    failures.push(`manifest at ${base}index.json is missing or lacks skills[]`);
  } else {
    for (const skill of manifest.skills) {
      if (!skill.name || !Array.isArray(skill.files)) {
        failures.push(`manifest entry invalid: ${JSON.stringify(skill)}`);
        continue;
      }
      for (const file of skill.files) {
        const url = `${base}${skill.name}/${file}`;
        const res = await fetch(url);
        if (res.status !== 200) failures.push(`GET ${url} -> ${res.status}`);
      }
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
  await rm(join(baseDir, ".tmp"), { recursive: true, force: true }).catch(() => {});
}

if (failures.length) {
  for (const f of failures) console.error(`[error] ${f}`);
  console.error(`\n✗ catalog HTTP check failed: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log(`\n✓ catalog HTTP check passed: manifest + payloads reachable at <base>/index.json and <base>/<name>/<file>`);
