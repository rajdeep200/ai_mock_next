import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email?: string;
  fullName?: string; // ← NEW
  plan: "free" | "starter" | "pro";
  subscriptionProvider?: "cashfree";
  subscriptionId?: string;
  planRenewsAt?: Date | null;
  cancelAtPeriodEnd?: boolean;
  createdAt: Date;
  updatedAt: Date;
  phone?: string;
  phoneVerified: false;
  phoneVerifiedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String },
    fullName: { type: String, default: "" }, // ← NEW
    plan: { type: String, enum: ["free", "starter", "pro"], default: "free" },

    subscriptionProvider: { type: String },
    subscriptionId: { type: String },
    planRenewsAt: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },

    phone: { type: String },
    phoneVerified: { type: Boolean, default: false },
    phoneVerifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
