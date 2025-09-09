import mongoose from "mongoose";

const InterviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    technology: { type: String, required: true },
    company: { type: String },
    level: { type: String, required: true },
    duration: { type: Number, required: true }, // in minutes
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      required: true,
    },
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    summary: String,
    feedback: String,
    modelPreparationPercent : {
      type: Number,
      min: 0,
      max: 100,
      default: null,
      set: (v: number | null) => typeof v === "number" ? Math.round(v) : v,
    },
    customerRating: { type: Number, min: 1, max: 5 },
    customerFeedback: String
  },
  { timestamps: true }
);

export default mongoose.models.InterviewSession ||
  mongoose.model("InterviewSession", InterviewSessionSchema);
