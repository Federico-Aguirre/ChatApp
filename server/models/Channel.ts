import { Schema, model, Document, Types } from "mongoose";

export interface IChannel extends Document {
  name: string;
  description?: string;
  isDirect: boolean;
  isPrivate: boolean;
  members: Types.ObjectId[];
  admins: Types.ObjectId[]; // 🔥 Campo para almacenar los administradores del canal
  createdBy?: Types.ObjectId;
}

const channelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    isDirect: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }], // 🔥 Array de referencias a User
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const Channel = model<IChannel>("Channel", channelSchema);
export default Channel;