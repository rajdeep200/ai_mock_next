// models/InviteRedemption.ts
import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export interface IInviteRedemption extends Document {
  inviteId: Types.ObjectId;
  clerkId: string;
  redeemedAt: Date;
}

const InviteRedemptionSchema = new Schema<IInviteRedemption>(
  {
    inviteId: {
      type: Schema.Types.ObjectId,
      ref: "Invite",
      required: true,
      index: true,
    },
    clerkId: {
      type: String,
      required: true,
      index: true,
    },
    redeemedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);

InviteRedemptionSchema.index({ inviteId: 1, clerkId: 1 }, { unique: true });

export const InviteRedemption =
  models.InviteRedemption ||
  model<IInviteRedemption>("InviteRedemption", InviteRedemptionSchema);
