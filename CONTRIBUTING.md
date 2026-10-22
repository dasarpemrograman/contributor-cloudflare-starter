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

## Commit messages and pull request titles

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
for every commit and pull request title:

```text
type(optional-scope): short description

Optional body explaining why the change is needed.

Optional footers, such as BREAKING CHANGE: explain the migration.
```

Use `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, or `revert`. Keep the subject concise, use sentence-style lowercase,
and omit the final period. A scope names the affected feature or area.
Mark breaking changes with `!` after the type/scope or a `BREAKING CHANGE:` footer.

```text
feat(greeting): support localized greetings
fix(greeting): handle blank names
docs(readme): add application screenshots
ci: enforce conventional commit messages
```

`npm ci` installs a Husky `commit-msg` hook automatically. It rejects invalid
messages before a commit is created. CI independently checks the entire commit
history, including the initial commit, and the pull request title. Run
`npm run commitlint:history` locally to check history. If a message fails, correct
it with `git commit --amend` or an interactive rebase before updating the PR.
Coordinate with collaborators before rewriting any shared history.

Use squash or rebase merges. Squash commits use the validated PR title; merge
commits such as `Merge pull request ...` do not follow this repository's format.
Local hooks are convenience checks; the required `commit-messages` check on
`main` enforces the same rules even when a hook is bypassed.

## Code conventions

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
