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
    modelPreparationPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
      set: (v: number | null) => (typeof v === "number" ? Math.round(v) : v),
    },
    // Conversation, owned by the server (the client only ever sends its next message)
    transcript: {
      type: [
        new mongoose.Schema(
          {
            role: { type: String, enum: ["user", "assistant", "system"], required: true },
            content: { type: String, required: true },
            at: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    turnCount: { type: Number, default: 0 }, // AI turns used (capped per interview)
    lastTurnAt: { type: Date, default: null }, // for the minimum gap between turns
    feedbackGenerated: { type: Boolean, default: false }, // the real AI feedback exists (placeholders don't count)
    summaryLockAt: { type: Date, default: null }, // set while feedback is being generated
    scoreBreakdown: { type: mongoose.Schema.Types.Mixed, default: null }, // per-dimension rubric scores
    // What this interview cost us: raw counts, priced in lib/cost.ts
    usage: {
      turnCalls: { type: Number, default: 0 },
      turnInTokens: { type: Number, default: 0 },
      turnOutTokens: { type: Number, default: 0 },
      ttsCalls: { type: Number, default: 0 },
      ttsChars: { type: Number, default: 0 },
      scoreModel: { type: String, default: null },
      scoreInTokens: { type: Number, default: 0 },
      scoreOutTokens: { type: Number, default: 0 },
    },
    customerRating: { type: Number, min: 1, max: 5 },
    customerFeedback: String,

    shareSlug: { type: String, index: true, unique: true, sparse: true },
    shareEnabled: { type: Boolean, default: false },
    sharedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.InterviewSession ||
  mongoose.model("InterviewSession", InterviewSessionSchema);
