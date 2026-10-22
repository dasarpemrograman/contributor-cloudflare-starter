# 0001: Start with a small, feature-oriented Worker

Status: Accepted

## Context

The starter must support independent human contributions and instantiate itself
in another Cloudflare account. No product domain or persistent data requirement
has been specified.

## Decision

Use one TypeScript module Worker with explicit routing, colocated feature tests,
generated environment types, and a working stateless first run. Deploy through
Wrangler and the public-repository Deploy Button. Pin development dependencies
and commit the lockfile. Use npm scripts across Windows, macOS, Linux, and CI.

## Consequences

Contributors can read an entire capability in a few files. Deployment requires
no storage provisioning, migrations, provider accounts, or application secrets.
The tradeoff is that this starter does not demonstrate persistence or a frontend
framework. Add those when a real capability requires them, with its tests and
installation contract. The repository URL must be configured before the template
button is usable; cloud deployment remains a separate verification step.
