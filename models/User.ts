import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
  nik: { type: String, trim: true, sparse: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["member", "admin", "superadmin"], default: "member", index: true },
  memberId: { type: Schema.Types.ObjectId, ref: "Member", default: null },
  active: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
