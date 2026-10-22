import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const report = JSON.parse(
  await readFile(process.argv[2] ?? 'reports/zap.json', 'utf8'),
);
assert(
  Array.isArray(report.site) && report.site.length > 0,
  'ZAP did not scan any site.',
);
const alerts = report.site.flatMap((site) => {
  assert(Array.isArray(site.alerts), 'ZAP report is missing its alert list.');
  return site.alerts;
});
assert(
  alerts.every((alert) => Number.isInteger(Number(alert.riskcode))),
  'Invalid ZAP risk severity.',
);
const blockers = alerts.filter((alert) => Number(alert.riskcode) >= 2);
for (const alert of blockers)
  console.error(`ZAP ${alert.pluginid}: ${alert.name ?? alert.alert}`);
assert.equal(
  blockers.length,
  0,
  'ZAP found medium/high-risk alerts. Review reports/zap.html.',
);
console.log(
  `ZAP: no medium/high-risk alerts; ${alerts.length} total alert types recorded.`,
);
