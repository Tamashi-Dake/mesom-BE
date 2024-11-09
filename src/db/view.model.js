import mongoose from "mongoose";

const viewSchema = new mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postID: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  // TTL (Time to Live)
  // TODO: increase to 10 minutes in production
  createdAt: { type: Date, expires: 300, default: Date.now },
});

const View = mongoose.model("View", viewSchema);

export default View;
