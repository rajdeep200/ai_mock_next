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
  },
  { timestamps: true }
);

export default models.SubscriptionOrder ||
  model<ISubscriptionOrder>("SubscriptionOrder", SubscriptionOrderSchema);
