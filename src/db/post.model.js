import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    // images can be an array of strings
    images: [{ type: String }],
    parentPostID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    userLikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    userShared: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    userReplies: { type: Number },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
