# Quality gates

This repository uses tools that run without paid subscriptions, SaaS accounts,
or application credentials. GitHub hosts the public repository and standard
Linux CI runners. The Cloudflare Worker still deploys on the Free plan.
The scanners and browser tools are development dependencies, not runtime code.

## Merge policy

`main` requires `commit-messages` and the aggregate `quality-gates` check.
The aggregate requires every job below to succeed; failures, cancellations,
and skipped jobs block it. The rule applies to administrators too.
Changes go through a pull request with Conventional Commit messages and title.
Rebase or squash after the checks pass. GitHub settings must also be configured
for template forks; they are not copied with the source code.

| Job               | Blocking policy                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `check`           | TypeScript, ESLint, formatting, runtime/API contract tests, report-policy tests, coverage, deploy dry run and bundle budgets                    |
| `commit-messages` | Conventional Commits across history and the PR title                                                                                            |
| `maintainability` | Qlty complexity, nesting, parameters, returns and duplication; any reported smell fails                                                         |
| `security`        | Trivy HIGH/CRITICAL dependency vulnerabilities, secrets or supported misconfigurations, including unfixed findings and development dependencies |
| `codeql`          | Any finding from the JavaScript/TypeScript security-extended queries fails                                                                      |
| `browser`         | Desktop/light and mobile/dark Chromium flows, axe accessibility, Lighthouse budgets, passive ZAP DAST                                           |

All jobs run on pull requests and relevant pushes; weekly scheduled runs catch
new vulnerability advisories. Workflow actions are pinned to full commit SHAs,
tokens have read-only repository access, checkout credentials are not persisted,
and PR-controlled titles are passed as environment data rather than shell code.
Dependabot proposes weekly npm and Actions updates using Conventional Commits.

## Coverage and budgets

- Runtime code: at least 95% lines, statements and functions; 90% branches.
- PRs: at least 95% of executable added/changed lines covered. Coverage uses
  Istanbul because Workers does not support native V8 coverage.
- Worker bundle: at most 50,000 bytes raw and 15,000 bytes gzip.
- Lighthouse: median performance score at least 95 and median LCP at most
  2,000 ms across three audits; each audit must have accessibility score 100,
  CLS at most 0.01 and blocking time at most 100 ms.
- axe: zero WCAG A/AA violations from its WCAG 2.0/2.1 rules.
- ZAP: medium/high-risk alerts block merging. Low/informational alerts remain
  in the HTML report. Its baseline scanner is passive, not an active attack test.
  The CLI's `-I` flag only prevents low-level warnings from deciding the exit code;
  `check-zap.mjs` independently enforces the risk threshold and rejects missing reports.

Tests and generated platform declarations are excluded from runtime coverage.
Generated files and tests are excluded from maintainability smell metrics;
tests still run and are linted/formatted. Coverage is not proof of correctness,
and automated accessibility checks do not replace keyboard/screen-reader review.

## Apply the 18-category model honestly

| Category                     | Implementation or applicability                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G01 CI and merge enforcement | Required GitHub checks and protected main                                                                                                                      |
| G02 Lint, formatting, types  | ESLint, Prettier, TypeScript                                                                                                                                   |
| G03 Maintainability          | Qlty CLI smells, including duplication                                                                                                                         |
| G04 Behavioral tests         | Vitest in Workers runtime plus browser E2E                                                                                                                     |
| G05 Coverage                 | Istanbul thresholds and changed-line gate                                                                                                                      |
| G06 SAST                     | CodeQL security-extended; findings fail CI                                                                                                                     |
| G07 Dependency risk          | Trivy vulnerability scanning; no claim to detect all malicious packages                                                                                        |
| G08 Secrets                  | Trivy checks the current source tree; historical secret scanning is not included                                                                               |
| G09 IaC/Kubernetes           | Trivy handles supported misconfigurations; Wrangler is validated by dry run. No Terraform/Kubernetes exists to scan                                            |
| G10 Containers               | Not applicable: the app ships a Worker, not a container image                                                                                                  |
| G11 SBOM/licenses            | CycloneDX dependency and available license metadata inventory. No legal license allow/deny policy has been chosen                                              |
| G12 Dependency updates       | Dependabot for npm and GitHub Actions                                                                                                                          |
| G13 API compatibility        | Exact response/status/header contracts in `src/app.test.ts`; no published OpenAPI version to diff or fuzz yet                                                  |
| G14 Browser/visual           | Chromium flow checks and screenshots. Pixel-baseline comparison is deferred; screenshots are review artifacts                                                  |
| G15 Accessibility            | axe WCAG checks and Lighthouse assertions                                                                                                                      |
| G16 Performance/size         | Lighthouse budgets and Wrangler bundle limits                                                                                                                  |
| G17 DAST                     | Passive ZAP baseline against an isolated local instance; no authenticated/active penetration testing                                                           |
| G18 Supply chain             | Locked dependencies, immutable action references, read-only CI tokens, dependency updates and required checks. No overall Scorecard/security attestation claim |

This is a scoped implementation, not a claim that all 18 categories are fully
covered. Add schema fuzzing, visual baselines, image scanning, a license policy,
and authenticated security tests when the corresponding product needs appear.
Qlty Cloud, Codecov, commercial AI reviewers and cloud upload tokens are optional
and are not needed for a green build.

## Run locally

```sh
npm ci
npm run check
npm run check:bundle
npx playwright install chromium
npm run test:e2e
```

For changed-line coverage after committing your change:

```sh
node scripts/check-changed-coverage.mjs origin/main
```

Qlty CLI is separate from npm. Install it using its official instructions,
then run `qlty smells --all --sarif > reports/maintainability.sarif` and
`node scripts/check-sarif.mjs reports/maintainability.sarif` (create `reports/` first).
CI installs Qlty automatically without a Qlty Cloud account.

For performance checks, run a Worker on port 8788 and use `npm run audit:performance`.
Chrome must be installed; `CHROME_PATH` can select its executable. The workflow
shows the matching Trivy and Docker/ZAP commands. Security failures are fixed or
reviewed in a documented policy change; do not silently ignore scanners or lower
thresholds to get a green check.

Coverage, maintainability, CodeQL, SBOM, browser traces, screenshots, Lighthouse
and ZAP reports are GitHub Actions artifacts retained for seven days. Raw Trivy
secret matches are not uploaded as artifacts. Reports stay within GitHub; there
is no upload to Qlty Cloud or a public Lighthouse storage service.

## Free-access boundaries and references

These defaults target this public GitHub repository. CodeQL's free availability
and GitHub Free branch protection do not carry over unchanged to private forks.
Review the host's current plan or replace affected checks before moving private.
Qlty CLI is Fair Source and free to use, rather than OSI open source.

References checked October 22, 2026:
[GitHub branch protection](https://docs.github.com/en/rest/branches/branch-protection),
[Qlty CLI](https://github.com/qltysh/qlty),
[Trivy Action](https://github.com/aquasecurity/trivy-action),
[Workers coverage](https://developers.cloudflare.com/workers/testing/vitest-integration/known-issues/),
[CodeQL](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning),
[Playwright](https://playwright.dev/docs/test-intro),
[axe](https://github.com/dequelabs/axe-core-npm),
[Lighthouse](https://github.com/GoogleChrome/lighthouse),
[ZAP baseline](https://www.zaproxy.org/docs/docker/baseline-scan/).
