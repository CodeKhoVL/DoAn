// lib/models/User.ts
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  image?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    image: { type: String },
    role: { type: String, default: "user", enum: ["user", "admin"] },
  },
  { timestamps: true }
);

const User = (mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema)) as Model<IUser>;

export default User;