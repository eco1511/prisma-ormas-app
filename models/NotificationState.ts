import mongoose, { Schema } from "mongoose";
const NotificationStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  readIds: { type: [Schema.Types.ObjectId], default: [] },
  readThrough: { type: Date, default: new Date(0) },
}, { timestamps: true });
export const NotificationState = mongoose.models.NotificationState || mongoose.model("NotificationState", NotificationStateSchema);
