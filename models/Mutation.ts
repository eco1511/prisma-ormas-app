import mongoose, { Schema } from "mongoose";

const MutationSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true, index: true },
  requestType: { type: String, enum: ["Mutasi", "Perubahan Jabatan", "Nonaktif", "Aktif Kembali"], required: true },
  targetLevel: { type: String, default: "" },
  targetPosition: { type: String, default: "" },
  reason: { type: String, required: true },
  documentUrl: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  reviewNotes: { type: String, default: "" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

export const Mutation = mongoose.models.Mutation || mongoose.model("Mutation", MutationSchema);
