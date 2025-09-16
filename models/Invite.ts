import crypto from 'crypto'
import mongoose, {Schema, Model, Document} from 'mongoose'

export type InviteStatus = 'created' | 'sent' | 'redeemed' | 'expired' | 'revoked';
export interface InviteBenefits {
    type: 'pro_days';
    amount: number
}

export interface InviteDocs extends Document {
    tokenHash: string;
    status: InviteStatus;
    issuedByUserId?: string | null;
    redeemedByUserId?: string | null;
    campaign?: string | null;
    benefit: InviteBenefits;
    maxRedemptions: number;
    redemptions: number;
    expiresAt?: Date | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface InviteModel extends Model<InviteDocs> {
    hashToken(raw: string): string;
    findUsableByToken(raw: string): Promise<InviteDocs | null>;
}

const InviteSchema = new Schema<InviteDocs, InviteModel>({
    tokenHash: {
        type: String,
        required: true,
        unique: true
    },
    status: {
      type: String,
      enum: ["created", "sent", "redeemed", "expired", "revoked"],
      default: "created",
      index: true,
    },
    issuedByUserId: { type: String, default: null, index: true },
    redeemedByUserId: { type: String, default: null, index: true },
    campaign: { type: String, default: null, index: true },
    benefit: {
        type: {
            type: String,
            enum: ['pro_days'],
            required: true
        },
        amount: { type: Number, required: true, min: 1 }
    },
    maxRedemptions: { type: Number, default: 1, min: 1 },
    redemptions: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null, index: true },
    notes: { type: String, default: null },
}, { timestamps: true })

InviteSchema.index({tokenHash: 1}, {unique: true})
InviteSchema.index({ status: 1, expiresAt: 1 });
InviteSchema.index({ campaign: 1, status: 1 });

InviteSchema.statics.hashToken = function hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw, 'utf-8').digest('base64url')
}

InviteSchema.statics.findUsableByToken = async function findUsableByToken(raw: string) {
    const tokenHash = this.hashToken(raw)
    const now = Date.now()

    const invite = await this.findOne({
        tokenHash,
        status: {
            $in:['created', 'sent']
        },
        $or: [
            {expiresAt: null},
            {expiresAt: {$gt: now}}
        ]
    })

    if(!invite) return null
    if(invite.redemptions >= invite.maxRedemptions) return null

    return invite;
}

const Invite = mongoose.models.Invite as InviteModel || mongoose.model<InviteDocs, InviteModel>('Invite', InviteSchema)
export default Invite;