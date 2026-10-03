import mongoose, { Schema } from "mongoose";
const MasterLevelSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });
export const MasterLevel = mongoose.models.MasterLevel || mongoose.model("MasterLevel", MasterLevelSchema);
