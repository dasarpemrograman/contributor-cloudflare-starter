# 0002: Require scoped, free quality gates

Status: Accepted

## Context

The public template needs merge-failing checks for more than syntax and commit
messages while preserving its zero-secret Cloudflare Free first run.

## Decision

Use GitHub Actions with Qlty CLI, Trivy, CodeQL, runtime coverage, Chromium/axe,
Lighthouse and passive ZAP checks. Require an aggregate check on main so a failed
or skipped scanner cannot appear as a successful quality gate. Keep dependencies
in the development toolchain and publish reports as short-lived GitHub artifacts.
Use Dependabot for update proposals and full SHA references for workflow actions.

## Consequences

Contributors gain deterministic failure policies and runnable local checks.
CI takes longer and includes more development tools; runtime remains a single
small Worker without third-party packages. Public-repository free entitlements
must be reconsidered before moving private. The gate map documents partial
coverage and inapplicable categories instead of asserting complete security,
legal license compliance, pixel-level regression, or an optimal tool set.
Performance uses three-run medians to reduce isolated runner startup noise.
