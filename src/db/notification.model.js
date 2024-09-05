import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["follow", "like", "comment", "reply", "share"],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    read: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    show: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
// Tạo index TTL dựa trên trường deletedAt
notificationSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 60 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
