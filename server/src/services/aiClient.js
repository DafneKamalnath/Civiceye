import axios from "axios";

const CATEGORY_DEPARTMENT_MAP = {
  pothole: "Roads",
  road: "Roads",
  streetlight: "Electricity",
  water: "Water",
  garbage: "Sanitation",
  tree: "Parks",
  other: "Other",
};

/**
 * Fallback heuristic keyword classifier when ai-service is unreachable.
 * @param {string} text
 * @returns {{ category: string, severity: string, department: string, summary: string }}
 */
export function classifyWithKeywords(text = "") {
  const lower = (text || "").toLowerCase();

  let category = "other";
  if (/(pothole|crater|pavement defect|sinkhole|asphalt hole)/i.test(lower)) {
    category = "pothole";
  } else if (/(street\s*light|light\s*pole|dark\s*street|lamp\s*post|power\s*cut|wire|electric)/i.test(lower)) {
    category = "streetlight";
  } else if (/(water|pipe|leak|burst|sewage|drain|flooding|hydrant|overflow)/i.test(lower)) {
    category = "water";
  } else if (/(garbage|trash|waste|dump|litter|refuse|stench|bin overflow)/i.test(lower)) {
    category = "garbage";
  } else if (/(tree|branch|fallen tree|roots|foliage|park)/i.test(lower)) {
    category = "tree";
  } else if (/(road|crack|curb|traffic|crosswalk|divider|sidewalk)/i.test(lower)) {
    category = "road";
  }

  let severity = "medium";
  if (/(urgent|danger|hazard|severe|deep|massive|emergency|hospital|accident|fire|sparking|life-threatening)/i.test(lower)) {
    severity = "high";
  } else if (/(minor|small|slight|cosmetic|tiny|flickering)/i.test(lower)) {
    severity = "low";
  }

  const department = CATEGORY_DEPARTMENT_MAP[category] || "Other";
  const summary = text.length > 120 ? `${text.slice(0, 117)}...` : text || `Civic issue reported in category: ${category}`;

  return {
    category,
    severity,
    department,
    summary,
  };
}

/**
 * Call the Python ai-service at AI_SERVICE_URL or fall back to keyword classification.
 * @param {string} text
 * @param {Express.Multer.File | null} file
 * @returns {Promise<{ category: string, severity: string, department: string, summary: string }>}
 */
export async function analyzeReport(text = "", file = null) {
  const serviceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

  try {
    const FormData = (await import("form-data")).default || globalThis.FormData;
    const form = new FormData();
    form.append("text", text);

    if (file && file.buffer) {
      if (form.append.length === 3) {
        // Node form-data
        form.append("image", file.buffer, {
          filename: file.originalname || "image.jpg",
          contentType: file.mimetype || "image/jpeg",
        });
      } else {
        // Web standard FormData
        const blob = new Blob([file.buffer], { type: file.mimetype || "image/jpeg" });
        form.append("image", blob, file.originalname || "image.jpg");
      }
    }

    const headers = typeof form.getHeaders === "function" ? form.getHeaders() : {};

    const response = await axios.post(`${serviceUrl}/analyze`, form, {
      headers,
      timeout: 5000,
    });

    if (response.data) {
      const data = response.data;
      const validCategories = ["pothole", "streetlight", "water", "garbage", "tree", "road", "other"];
      const category = validCategories.includes(data.category) ? data.category : "other";

      let severity = "medium";
      if (data.severity === "high" || data.severity >= 4) severity = "high";
      else if (data.severity === "low" || data.severity <= 2) severity = "low";
      else severity = "medium";

      const department = data.department || CATEGORY_DEPARTMENT_MAP[category] || "Other";
      const summary = data.summary || text.slice(0, 120) || `AI analyzed issue: ${category}`;

      return { category, severity, department, summary };
    }
  } catch (error) {
    console.warn(`[AI Service] AI service at ${serviceUrl} unavailable (${error.message}). Falling back to keyword analysis.`);
  }

  // Graceful fallback
  return classifyWithKeywords(text);
}