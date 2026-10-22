# Deployment contract

`wrangler.jsonc` declares the Worker, public title, compatibility date, and logging.
`package.json` declares build/deploy commands and binding descriptions.
`package-lock.json` locks the dependency tree. All build inputs live in this root.

Before publishing the template, run `npm run template:configure -- <public-repo-url>`,
`npm run format`, and `npm run template:check`. The latter checks URL consistency;
it cannot prove repository visibility or authorize a deployment.

The Deploy Button supports public GitHub/GitLab Workers repositories. The
maintainer publishes this folder as its own repository root. Users deploy through
the configured README button; they do not need a terminal. There are no required
resources beyond the Worker and no initialization step for this stateless app.

## Validate a release

1. From a clean checkout, run `npm ci`, `npm run check`, and `npm run deploy:check`.
2. Verify the public source URL and use the button to create a fresh instance.
3. Open its welcome page and run `npm run smoke -- https://INSTANCE.workers.dev`.
4. Push a small change to the new instance's connected branch and verify that
   Workers Builds redeploys it. Re-run smoke checks.

Steps 2–4 require the actual public repository and Cloudflare account. A dry run
does not prove provisioning or remote availability. GitHub CI validates code;
Workers Builds handles connected deployment and its own account credentials.
GitLab users can run the same npm checks in their own CI.

## Operations

Use `npx wrangler tail` for live logs and `npx wrangler rollback` to revert a Worker
release. Keep runtime secrets in Cloudflare, never in source. Dashboard variable
edits may be replaced by the next deployment; commit shared defaults in config.
Before updating toolchains, run all checks and review compatibility-date changes.

Official reference: https://developers.cloudflare.com/workers/platform/deploy-buttons/
