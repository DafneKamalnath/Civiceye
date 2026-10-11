import Report from "../models/Report.js";

/**
 * Calculates Haversine distance in meters between two coordinates.
 * @param {{ lat: number, lng: number }} a
 * @param {{ lat: number, lng: number }} b
 * @returns {number}
 */
export function distanceMeters(a, b) {
  if (!a || !b || a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
    return Infinity;
  }
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Computes Jaccard word-level similarity between two texts.
 * @param {string} a
 * @param {string} b
 * @returns {number} 0 to 1
 */
export function similarity(a = "", b = "") {
  const words = (s) => new Set((s || "").toLowerCase().match(/\w+/g) || []);
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  const shared = [...A].filter((w) => B.has(w)).length;
  return shared / new Set([...A, ...B]).size;
}

/**
 * Finds if there is an existing open or in_progress report matching:
 * - same category
 * - within radiusMeters (~150m)
 * - similar text (title or description overlap)
 *
 * @param {{ category: string, location: { lat: number, lng: number }, text?: string, title?: string, description?: string }} reportData
 * @param {number} radiusMeters
 * @returns {Promise<import("../models/Report.js").default | null>}
 */
export async function findDuplicate(reportData, radiusMeters = 150) {
  if (!reportData?.location || reportData.location.lat == null || reportData.location.lng == null) {
    return null;
  }

  // Find candidate non-resolved reports in the same category
  const candidates = await Report.find({
    category: reportData.category,
    status: { $ne: "resolved" },
    duplicateOf: null, // compare with parent / canonical reports
  }).limit(150);

  const queryText = `${reportData.title || ""} ${reportData.description || ""} ${reportData.text || ""}`.trim();

  for (const candidate of candidates) {
    if (!candidate.location?.lat || !candidate.location?.lng) continue;

    const dist = distanceMeters(candidate.location, reportData.location);
    if (dist <= radiusMeters) {
      const candidateText = `${candidate.title || ""} ${candidate.description || ""}`.trim();
      const sim = similarity(candidateText, queryText);

      // If text similarity is moderate or texts both contain the category keywords within 150m
      if (sim >= 0.2 || dist <= 30) {
        return candidate;
      }
    }
  }

  return null;
}

export async function findDuplicates(reportData, radiusMeters = 150) {
  const match = await findDuplicate(reportData, radiusMeters);
  return match ? [match] : [];
}