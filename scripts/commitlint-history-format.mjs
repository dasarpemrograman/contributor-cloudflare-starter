// Bulk history checks should show subjects and findings, not entire release notes.
export default function format(report) {
  return report.results
    .flatMap((result) => {
      const findings = [
        ...result.errors.map((item) => `error: ${item.message} [${item.name}]`),
        ...result.warnings.map(
          (item) => `warning: ${item.message} [${item.name}]`,
        ),
      ];
      return findings.length ? [result.input.split('\n')[0], ...findings] : [];
    })
    .join('\n');
}
