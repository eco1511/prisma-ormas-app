import mongoose, { Schema } from "mongoose";
const PositionSchema = new Schema({
  name: { type: String, required: true },
  level: { type: String, required: true },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true });
PositionSchema.index({ name: 1, level: 1 }, { unique: true });
export const Position = mongoose.models.Position || mongoose.model("Position", PositionSchema);
