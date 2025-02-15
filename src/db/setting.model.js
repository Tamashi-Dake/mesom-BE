import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blockedUser: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    notificationPreferences: {
      blockedType: {
        type: Object,
        default: {
          reply: true,
          like: true,
          follow: true,
          share: true,
        },
      },
      blockedPost: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      ],
      blockedUser: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    themePreferences: {
      theme: {
        type: String,
        default: "light",
      },
      accent: {
        type: String,
        default: "blue",
      },
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
