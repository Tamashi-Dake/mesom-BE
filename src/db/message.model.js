import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    images: [{ type: String }],
    type: {
      type: String,
      enum: ["text", "image", "text_image"],
      default: "text",
    },
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reaction: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
        },
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    isDeleted: { type: Boolean, default: false },
    isSeen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
