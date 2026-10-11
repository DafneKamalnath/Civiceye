/**
 * Calculates a dynamic priority score for a civic report.
 * Factors:
 * 1. Severity weight (low: 1, medium: 2, high: 3)
 * 2. Duplicate reports & upvotes (community density)
 * 3. Age of unresolved report (escalates over time)
 * 4. Location context (proximity or mentions of schools, hospitals, emergency zones)
 *
 * @param {Object} report
 * @returns {number} Priority score
 */
export function computePriority(report = {}) {
  let score = 0;

  // 1. Severity weight
  const severityWeights = { low: 1, medium: 2, high: 3 };
  score += severityWeights[report.severity] ?? 2;

  // 2. Duplicate count & upvotes
  const duplicateCount = Number(report.duplicateCount) || 0;
  const upvotes = Number(report.upvotes) || 0;
  score += Math.min(duplicateCount, 20) * 0.5;
  score += Math.min(upvotes, 20) * 0.2;

  // 3. Report age (older unresolved tickets creep upward)
  if (report.createdAt) {
    const ageDays = (Date.now() - new Date(report.createdAt).getTime()) / 86400000;
    if (ageDays > 0) {
      score += Math.min(ageDays, 14) * 0.15;
    }
  }

  // 4. Location Context (sensitive zones: schools, hospitals, transit hubs)
  const contextString = `${report.address || ""} ${report.description || ""} ${report.title || ""} ${report.location?.address || ""}`.toLowerCase();
  const sensitiveRegex = /(school|hospital|clinic|kindergarten|daycare|nursing home|emergency|ambulance|pedestrian zone|play\s*ground|senior center)/i;

  if (sensitiveRegex.test(contextString)) {
    score += 2.0; // Significant priority boost for sensitive community zones
  }

  return Number(score.toFixed(2));
}