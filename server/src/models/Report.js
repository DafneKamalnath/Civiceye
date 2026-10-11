import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: String,
    imageUrl: String,
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },
    aiResult: {
      category: String,
      severity: Number,
      confidence: Number,
      context: [String],
      durationDays: Number,
    },
    embedding: { type: [Number], select: false }, // hidden by default (it's large)
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);