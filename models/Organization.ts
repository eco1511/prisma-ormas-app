import mongoose, { Schema } from "mongoose";
const OrganizationSchema = new Schema({
  name: { type: String, required: true, index: true },
  legalNumber: { type: String, required: true, unique: true },
  category: { type: String, default: "Umum" },
  provinceBoards: { type: Number, default: 0 },
  districtBoards: { type: Number, default: 0 },
  cityBoards: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });
export const Organization = mongoose.models.Organization || mongoose.model("Organization", OrganizationSchema);
