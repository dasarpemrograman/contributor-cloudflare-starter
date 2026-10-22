# Run quality gates before pushing

Use Node.js 24 in a Git checkout. Install dependencies once:

```sh
npm ci
npm run quality
```

`quality` runs the core profile: application and tooling typechecks, lint for
source/tests/scripts/configuration, formatting, runtime coverage, gate-policy
tests, bundle/deploy validation, Conventional Commit history, and changed-line
coverage. It uses your current working tree, including staged, unstaged and
untracked runtime files. No code is pushed or deployed by this command.

`npm ci` installs a **pre-push hook** that runs this same core profile before Git
uploads commits. Complete or save your work before pushing: the hook validates
the checkout contents, not a separate copy of an older committed tree.

The comparison base defaults to `origin/main`. Fetch the latest base when needed:

```sh
git fetch origin
npm run quality -- --base origin/main
```

For an initial local repository with a commit but no origin, use `--base HEAD`.
Core checks do not need scanner installations, Docker, browser binaries,
application secrets, or Cloudflare deployment credentials.

## Full local profile

```sh
npm run quality:setup
npm run quality:doctor
npm run quality:full
```

`quality:setup` installs Playwright Chromium. It does not silently install Docker
or native scanners. `quality:doctor` checks the full profile's prerequisites and
prints installation instructions for anything missing. Missing tools or an
unavailable Docker engine produce a nonzero exit; they never become skipped,
successful gates.

| Prerequisite                       | Purpose                                                     | Installation                                                                                                                  |
| ---------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Qlty CLI                           | Complexity and duplication                                  | [Qlty CLI](https://docs.qlty.sh/cli); tested with 0.661.0                                                                     |
| Trivy 0.76.1                       | Vulnerabilities, secrets, supported misconfigurations, SBOM | [Trivy](https://trivy.dev/latest/getting-started/installation/)                                                               |
| CodeQL CLI bundle 2.27.3           | JavaScript/TypeScript security-extended queries             | [CLI bundle](https://github.com/github/codeql-action/releases/tag/codeql-bundle-v2.27.3); install the bundle with query packs |
| Docker with a running Linux engine | Passive ZAP DAST                                            | Docker Engine or Docker Desktop in Linux-container mode                                                                       |
| Playwright Chromium                | Browser, axe and Lighthouse                                 | `npm run quality:setup`                                                                                                       |

Put native tools on `PATH`, or set `QLTY_PATH`, `TRIVY_PATH`, `CODEQL_PATH` and
`DOCKER_PATH` to their executable paths. These are ordinary process environment
variables, not application secrets. For example, in PowerShell:

```powershell
$env:CODEQL_PATH = 'C:\tools\codeql\codeql.exe'
npm run quality:doctor
npm run quality:full
```

The full profile first checks all prerequisites, then runs core, maintainability,
security, CodeQL and browser stages. Browser checks cover desktop/light and
mobile/dark layouts and axe; Lighthouse and ZAP use a temporary Worker that the
runner starts and stops automatically. Lighthouse uses the installed Playwright
Chromium unless `CHROME_PATH` selects another Chrome executable.

On native Linux, the audit Worker binds to loopback and ZAP uses Docker host
networking. On Windows/macOS with Docker Desktop, the temporary audit Worker
binds to all interfaces on an automatically selected port so the container can
reach it through `host.docker.internal`. It is stopped after the audits. Run this
development profile in a trusted local environment; no production deployment is
involved. Initial scanner databases, query packs and the pinned ZAP image may
require network downloads.

## Rerun an individual stage

```sh
npm run quality:maintainability
npm run quality:security
npm run quality:codeql
npm run quality:browser
```

CI uses these same stage commands and failure policies. Its provisioned tools
and Linux environment can differ from your workstation, so a local pass does
not remove the required GitHub checks. CodeQL configuration is shared through
`.github/codeql/config.yml`; browser budgets and scanner report policies use the
same scripts in both environments.

## Results and failure handling

The console identifies the active stage and a nonzero exit blocks the push or
CI job. `reports/quality/local.json` records the selected profile, completed
stages, durations and whether the requested run completed. A core or doctor
result is labeled as such; it does not claim the full profile passed.

Other reports remain under `coverage/`, `reports/`, `test-results/` and
`playwright-report/`. ZAP reports from the shared runner are under `reports/zap/`.
All are ignored by Git. Fix findings and rerun the affected stage, then rerun
the chosen profile. See [quality-gate policies](quality-gates.md) for thresholds.

GitHub-specific controls remain on GitHub: branch protection, the required-check
aggregate, PR title validation, Dependabot scheduling and native secret push
protection. Local scripts reproduce analysis/testing, not those host permissions
or automation services. CodeQL's free use here is for this public repository;
private forks must check their eligibility.
