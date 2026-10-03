import mongoose, { Schema } from "mongoose";
const AuditLogSchema = new Schema({
  actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: { type: String, default: "" },
  details: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });
export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
