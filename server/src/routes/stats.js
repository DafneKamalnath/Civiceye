import { Router } from "express";
import Report from "../models/Report.js";

const router = Router();

/**
 * GET /api/stats
 * Aggregated statistics for dashboard metric cards and charts.
 */
router.get("/", async (req, res, next) => {
  try {
    const [total, open, inProgress, resolved, categoryAgg] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: "open" }),
      Report.countDocuments({ status: "in_progress" }),
      Report.countDocuments({ status: "resolved" }),
      Report.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const byCategory = {};
    const validCategories = ["pothole", "streetlight", "water", "garbage", "tree", "road", "other"];
    for (const cat of validCategories) {
      byCategory[cat] = 0;
    }
    for (const item of categoryAgg) {
      if (item._id) {
        byCategory[item._id] = item.count;
      }
    }

    res.json({
      total,
      open,
      in_progress: inProgress,
      resolved,
      byCategory,
      categories: categoryAgg.map((c) => ({ category: c._id, count: c.count })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
