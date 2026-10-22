# 0003: Share local and CI quality stages

Status: Accepted

## Context

Contributors need to validate changes before uploading commits. The audit also
found browser tests/configuration outside typechecking and feature boundaries
that were only documented conventions.

## Decision

Expose a core `quality` profile and a full `quality:full` profile. The installed
pre-push hook runs core checks. CI invokes the same stage implementations and
policies, provisioning native scanner tools on its runners. Full-profile
preflight fails when prerequisites are absent instead of reporting skipped
analysis as success. Local diff coverage includes the working tree and new files.

Expand TypeScript checking to browser tests/configuration, lint JavaScript
tooling, and enforce literal cross-feature import restrictions through ESLint.
Keep GitHub permissions, PR titles and update scheduling as host-side controls.

## Consequences

Ordinary contributors get one command without installing Docker or scanners.
Full local parity requires explicit tool installation and a Linux Docker engine.
On Docker Desktop, passive audits temporarily expose the development Worker on
an automatically selected host port; the runner owns and stops that process.
Local success remains evidence for review, while protected-main CI stays required.
