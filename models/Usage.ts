// app/models/Usage.ts
import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUsage extends Document {
  userId: string;        // Clerk userId
  month: string;         // "YYYY-MM"
  interviewsCount: number;
  minutesUsed: number;   // optional, if you want to cap minutes/month later
  createdAt: Date;
  updatedAt: Date;
}

const UsageSchema = new Schema<IUsage>({
  userId: { type: String, required: true, index: true },
  month: { type: String, required: true, index: true },
  interviewsCount: { type: Number, default: 0 },
  minutesUsed: { type: Number, default: 0 },
}, { timestamps: true });

UsageSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Usage =  models.Usage || model<IUsage>('Usage', UsageSchema);
