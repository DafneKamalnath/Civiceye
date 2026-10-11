import { Router } from "express";
import Report from "../models/Report.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { uploadImage } from "../services/cloudinary.js";
import { analyzeReport } from "../services/aiClient.js";
import { findDuplicate } from "../services/duplicate.js";
import { computePriority } from "../services/priority.js";

const router = Router();

/**
 * POST /api/reports
 * Create a new civic report.
 * Processes multipart image, executes AI classification & priority scoring,
 * performs geospatial deduplication.
 */
router.post("/", requireAuth, upload.single("image"), async (req, res, next) => {
  try {
    const title = (req.body.title || "").trim();
    const description = (req.body.description || "").trim();
    const address = (req.body.address || "").trim();
    const userCategory = (req.body.category || "").trim().toLowerCase();

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ message: "Valid location coordinates (lat, lng) are required" });
    }

    if (!title && !description && !req.file) {
      return res.status(400).json({ message: "Please provide a title, description, or image for the issue" });
    }

    // 1. Concurrently handle Cloudinary upload and AI analysis
    const [imageUrl, aiResult] = await Promise.all([
      req.file ? uploadImage(req.file.buffer) : Promise.resolve(null),
      analyzeReport(`${title}. ${description}`, req.file),
    ]);

    // 2. Determine category & department
    const validCategories = ["pothole", "streetlight", "water", "garbage", "tree", "road", "other"];
    const category = validCategories.includes(userCategory) ? userCategory : aiResult.category || "other";
    const severity = aiResult.severity || "medium";
    const department = aiResult.department || "Other";

    const reportLocation = { lat, lng, address };

    // 3. Check for duplicates within ~150 meters with similar details
    const existingDuplicate = await findDuplicate({
      category,
      location: reportLocation,
      title,
      description,
    });

    let duplicateOf = null;
    let merged = false;

    if (existingDuplicate) {
      merged = true;
      duplicateOf = existingDuplicate._id;
      existingDuplicate.duplicateCount = (existingDuplicate.duplicateCount || 0) + 1;
      // Recompute priority score for the parent issue
      existingDuplicate.priorityScore = computePriority(existingDuplicate);
      await existingDuplicate.save();
    }

    // 4. Compute priority score
    const priorityScore = computePriority({
      severity,
      duplicateCount: 0,
      upvotes: 0,
      location: reportLocation,
      title,
      description,
      address,
    });

    // 5. Save the report to database
    const report = await Report.create({
      title: title || aiResult.summary || `${category} issue`,
      description: description || title || "Civic issue reported",
      category,
      severity,
      priorityScore,
      status: "open",
      department,
      location: reportLocation,
      imageUrl,
      createdBy: req.user._id,
      duplicateOf,
      duplicateCount: 0,
      upvotes: 0,
    });

    res.status(201).json({
      success: true,
      merged,
      report,
      parentReport: existingDuplicate || null,
      ai: aiResult,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports
 * Query reports with filters (status, category, department) sorted by priorityScore descending.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, category, department } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }
    if (category && category !== "all") {
      filter.category = category;
    }
    if (department && department !== "all") {
      filter.department = department;
    }

    const reports = await Report.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .populate("createdBy", "name email role department")
      .populate("duplicateOf", "title status priorityScore");

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/mine
 * Citizen view: List current user's submitted reports.
 */
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const reports = await Report.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate("duplicateOf", "title status priorityScore");

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/reports/:id
 * Retrieve specific report by ID.
 */
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("createdBy", "name email role department")
      .populate("duplicateOf", "title status priorityScore");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/reports/:id/status
 * Authority only: update issue status (open | in_progress | resolved).
 */
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("authority", "admin"),
  async (req, res, next) => {
    try {
      const { status } = req.body;
      const validStatuses = ["open", "in_progress", "resolved"];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      ).populate("createdBy", "name email role department");

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json({ success: true, report });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/reports/:id/after-image
 * Authority only: upload verification photo for resolved tickets.
 */
router.post(
  "/:id/after-image",
  requireAuth,
  requireRole("authority", "admin"),
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "After image file is required" });
      }

      const imageUrl = await uploadImage(req.file.buffer, "civiceye_resolved");
      const report = await Report.findByIdAndUpdate(
        req.params.id,
        { afterImageUrl: imageUrl },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json({ success: true, report });
    } catch (error) {
      next(error);
    }
  }
);

export default router;