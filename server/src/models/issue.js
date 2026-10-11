import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["pothole", "garbage", "water_leak", "streetlight", "fallen_tree", "road_damage"],
      required: true,
    },
    summary: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    address: String,
    severity: { type: Number, min: 1, max: 5, default: 3 },
    reportCount: { type: Number, default: 1 },
    firstReportedAt: { type: Date, default: Date.now },
    priorityScore: { type: Number, default: 0 },
    priorityLabel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW" },
    department: String,
    nearSensitive: { type: Boolean, default: false },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
    statusHistory: [
      {
        status: String,
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
    imageUrl: String,
    afterImageUrl: String,
  },
  { timestamps: true }
);

issueSchema.index({ location: "2dsphere" });

export default mongoose.model("Issue", issueSchema);