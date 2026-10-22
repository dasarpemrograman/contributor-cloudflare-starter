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
