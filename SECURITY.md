# Security Policy

## Supported versions

Only the latest state of the `main` branch is supported. Security fixes land
there and are pushed to `main`.

## Reporting a vulnerability

Do not open a public issue for security problems. Report privately via
GitHub's Security Advisories ("Report a vulnerability" on the repo) or email
the maintainer.

## What this repo can and cannot do

This repository ships markdown instructions for agents — no compiled code, no
network daemons, no package installers. The attack surface is therefore small
but real:

- **Prompt injection via skill content** — if a third-party fork or catalog
  entry of this skill is modified to include malicious instructions, agents
  following it could be steered to act unsafely. Vet skill sources before
  installing (see README). Report any suspicious modification of the official
  repo.
- **Malicious PRs** — all code in this repo (linter, CI) runs in trusted
  contexts (maintainers' machines, GitHub Actions). CI runs on pull_request
  events from forks; review workflows before merging.

## Responsible disclosure

If you find a way this skill could be weaponized to harm an agent's operator,
report it privately with a proof-of-concept. We will acknowledge within 5
business days and track a fix.