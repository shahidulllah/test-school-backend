import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";
import { IUser } from "../interfaces/user.interface";

export interface IUserDoc extends IUser, Document {
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "student", "supervisor"],
      default: "student",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: [{ type: String }],
    otp: {
      code: { type: String },
      expiresAt: { type: Date },
      purpose: {
        type: String,
        enum: ["email_verification", "password_reset", "login"],
      },
    },
    highestLevel: {
      type: String,
      enum: ["A1", "A2", "B1", "B2", "C1", "C2", null],
      default: null,
    },
    certificates: [{ level: String, issuedAt: Date, certificateUrl: String }],
  },
  { timestamps: true }
);

// Pre-save hash
UserSchema.pre<IUserDoc>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

const UserModel = mongoose.model<IUserDoc>("User", UserSchema);

export default UserModel;
