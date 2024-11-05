import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String },
    images: [{ type: String }],
    parent: {
      parentPostID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
      // TODO: Khi update Username/ display name cần update thêm ở đây
      authorName: {
        type: String,
      },
    },
    userLikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    userShared: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    userBookmarks: { type: Number },
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
