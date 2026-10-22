# Contributor guidance

Read README.md and CONTRIBUTING.md first. Use the npm scripts as the common
workflow. Keep feature behavior and tests together under src/features.
Do not add infrastructure, secrets, providers, generic repositories, or frameworks
without a concrete feature requirement. Do not hand-edit generated Worker types.
Validate changes with npm run check; validate deployment contract changes with
npm run deploy:check. Keep the zero-secret first-run experience working.

Use Conventional Commits for every commit and PR title: type(scope): description.
See CONTRIBUTING.md for allowed types and examples. Run npm run commitlint:history
after creating commits. Do not bypass hooks or weaken commitlint/CI rules.
Read docs/quality-gates.md before changing gates or thresholds. Fix findings;
do not use continue-on-error, broad exclusions or suppressions to hide failures.
Keep the quality-gates aggregate dependent on every blocking job. Preserve
immutable action references and read-only CI token permissions.
Use npm run quality before pushing; the installed pre-push hook enforces this.
Use npm run quality:full when its documented external tools are available.
Never report a full-profile pass if prerequisites or stages are missing.
