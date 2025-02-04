import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "New Conversation" },
    avatar: { type: String },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isGroup: { type: Boolean, default: false },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    totalMessages: { type: Number, default: 0 },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    hiddenWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
