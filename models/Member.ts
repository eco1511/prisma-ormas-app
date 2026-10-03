import mongoose, { Schema } from "mongoose";

const MemberSchema = new Schema({
  memberNo: { type: String, unique: true, sparse: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  nik: { type: String, required: true, unique: true, trim: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  gender: { type: String, enum: ["Laki-laki", "Perempuan", ""], default: "" },
  birthDate: { type: Date, default: null },
  address: { type: String, required: true },
  province: { type: String, default: "" },
  city: { type: String, default: "" },
  organizationName: { type: String, default: "PRISMA" },
  level: { type: String, default: "Anggota" },
  position: { type: String, default: "Anggota" },
  branchType: { type: String, enum: ["Pusat", "Provinsi", "Kabupaten/Kota", "Kecamatan", "Anggota"], default: "Anggota" },
  membershipType: { type: String, enum: ["Pusat", "Cabang"], default: undefined },
  provinceId: { type: String, default: "" },
  cityId: { type: String, default: "" },
  skUrl: { type: String, default: "" },
  photoUrl: { type: String, default: "" },
  ktpUrl: { type: String, default: "" },
  status: { type: String, enum: ["pending", "active", "rejected", "inactive"], required: true, default: "pending", index: true },
  verificationNotes: { type: String, default: "" },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);


