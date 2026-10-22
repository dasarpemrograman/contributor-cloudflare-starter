# Architecture

One module Worker owns routing and two small features. `index.ts` receives the
platform request and environment; `app.ts` composes the features. Greeting
behavior receives a plain input string. Welcome rendering receives only the
public app title. Neither feature needs the entire environment.

There is no router framework, service container, shared utility folder, or
storage layer because the current behavior does not require them. TypeScript
checks the generated platform bindings. ESLint checks typed code and floating
promises. Runtime integration tests protect the public HTTP contract.
ESLint rejects literal relative imports, re-exports, dynamic imports and require
calls into another feature's internals. Compose capabilities in `app.ts` instead.
There are currently no import aliases; update the boundary rule before adding
an alias system. Human review still checks the semantic direction of dependencies.

## Add a feature

Create `src/features/<capability>/` with its behavior and tests. Register its route
explicitly in `app.ts`. Pass only the values and bindings that the feature needs.
If it has a nontrivial contract, document it beside the implementation.

## Add persistence when needed

Declare the resource in `wrangler.jsonc`, generate types, and keep the adapter
inside the owning feature. For D1, add versioned SQL migrations and local/remote
migration scripts. Reference the binding name (for example `DB`) in scripts.
Run remote migrations before publishing schema-dependent code. Verify the
current Deploy Button provisioning contract before choosing identifiers.
Prefer additive schema changes so old code keeps working during deployment.
Worker rollback does not undo a database migration.

## Add an optional provider

Declare and describe bindings in config/package metadata. Put local placeholders
in `.dev.vars.example` and real keys in Cloudflare secrets. Default to a useful
disabled/setup state when credentials are absent. Test both states. Never expose
credentials to the welcome page or put them in a public setup form.

## Add staging

Add an explicit Wrangler environment with its own variables and resource bindings;
do not assume bindings inherit. Update deployment commands, generated types,
and smoke checks together. The starter has one environment to keep installation
and everyday reasoning straightforward.
