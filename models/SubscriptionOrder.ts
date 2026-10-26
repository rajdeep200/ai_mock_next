import { Schema, model, models, Document } from "mongoose";

export interface ISubscriptionOrder extends Document {
  userId: string; // Clerk user id
  planId: "starter" | "pro";
  orderId: string; // Cashfree order_id
  status: "created" | "paid" | "failed" | "cancelled";
  amount: number;
  currency: string;
  raw?: any; // last webhook payload (optional)
  createdAt: Date;
  updatedAt: Date;
  cfOrderId: Number;
  cfPaymentId: String;
  lastWebhookEvent?: string;
  lastWebhookNote?: string;
  appliedAt?: Date | null;
}

const SubscriptionOrderSchema = new Schema<ISubscriptionOrder>(
  {
    userId: { type: String, required: true, index: true },
    planId: { type: String, enum: ["starter", "pro"], required: true },
    orderId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    cfOrderId: Number,
    cfPaymentId: String,
    // Audit trail (these were being written before but silently dropped by strict mode)
    raw: Schema.Types.Mixed,
    lastWebhookEvent: String,
    lastWebhookNote: String,
    // Set once this order has actually granted its plan to the user; makes upgrades idempotent
    appliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default models.SubscriptionOrder ||
  model<ISubscriptionOrder>("SubscriptionOrder", SubscriptionOrderSchema);
