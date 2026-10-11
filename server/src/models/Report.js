import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["pothole", "streetlight", "water", "garbage", "tree", "road", "other"],
      default: "other",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    priorityScore: {
      type: Number,
      default: 0,
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
      index: true,
    },
    department: {
      type: String,
      enum: ["Roads", "Water", "Electricity", "Sanitation", "Parks", "Other"],
      default: "Other",
      index: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: "" },
    },
    imageUrl: {
      type: String,
      default: null,
    },
    afterImageUrl: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null,
    },
    duplicateCount: {
      type: Number,
      default: 0,
    },
    upvotes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast geospatial / location queries and filtering
reportSchema.index({ "location.lat": 1, "location.lng": 1 });
reportSchema.index({ category: 1, status: 1 });

export default mongoose.model("Report", reportSchema);