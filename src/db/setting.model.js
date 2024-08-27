import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notificationPreferences: {
      blockedType: [
        {
          type: String,
          enum: ["follow", "like", "reply", "share"],
        },
      ],
      blockedPost: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      ],
    },
    themePreferences: {
      theme: {
        type: String,
        default: "light",
      },
      accentColor: {
        type: String,
        default: "blue",
      },
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;
