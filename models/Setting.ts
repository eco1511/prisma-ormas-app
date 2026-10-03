import mongoose, { Schema } from "mongoose";
const SettingSchema = new Schema({
  key: { type: String, unique: true, default: "main" },
  organizationName: { type: String, default: "PRISMA" },
  logoUrl: { type: String, default: "" },
  email: { type: String, default: "admin@prisma.local" },
  address: { type: String, default: "" },
  registrationOpen: { type: Boolean, default: true },
}, { timestamps: true });
export const Setting = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
