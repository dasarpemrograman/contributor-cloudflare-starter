# Contributing

Use Node.js 24. Run `npm ci`, then `npm run dev`. Start with `src/app.ts` to find
a route and follow its import into the feature. Run `npm run check` before opening
a pull request. CI uses the same checks and a deployment dry run.

## First safe contribution

1. Read `src/features/greeting/README.md` and the adjacent implementation and tests.
2. Add a greeting behavior, such as an optional locale, with a test that captures
   its observable behavior. Thread inputs explicitly from `src/app.ts`.
3. Run `npm test -- src/features/greeting`, then `npm run check`.
4. Explain the user-visible change and validation in your pull request.

## Working conventions

- Keep behavior, feature-specific types, tests, and explanations together.
- Keep dependencies visible in function parameters and imports. Use small concrete
  functions until there is a real need for an interface.
- Features do not import other feature internals. Compose them in `app.ts`;
  promote a stable public interface only when real sharing is needed.
- Add shared primitives only after they have multiple actual consumers.
- Put I/O at feature boundaries, using Cloudflare bindings. Do not hold request
  state in module globals. Await work or use the execution context for background work.
- Change bindings in Wrangler config, then regenerate types. Never edit generated types.
- Document public API changes and add an ADR for consequential architecture choices.
- Run `npm run format` to fix formatting. Never commit secrets or local state.

Routine feature changes need no special maintainer setup. Repository maintainers
can configure review ownership when the actual team is known.

## Review questions

Can a new contributor locate and explain this behavior? Can they run its relevant
tests? Is the dependency direction visible? Does a fresh deploy still start
without hidden setup? Does the pull request explain the evidence for safety?
