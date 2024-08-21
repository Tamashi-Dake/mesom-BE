import {
  createPost,
  createReplyPost,
  deletePost,
  getAllPosts,
  getPost,
  toggleLikePost,
  toggleSharePost,
} from "../controller/post.controller.js";
import { checkPostStatus, isAuthenticated } from "../middlewares/index.js";

// import upload from "../config/uploadConfig.js";

export default (router) => {
  // post routes
  router.post(
    "/posts",
    isAuthenticated,
    // upload.array("images", 4),
    createPost
  );
  router.post("/posts/:id", isAuthenticated, createReplyPost);
  router.get("/posts", isAuthenticated, getAllPosts);
  router.get("/posts/:id", getPost);
  // router.patch("/posts/:id", isAuthenticated,  updatePost);
  router.delete("/posts/:id", isAuthenticated, checkPostStatus, deletePost);

  // interaction routes
  router.post(
    "/posts/like/:id",
    isAuthenticated,
    checkPostStatus,
    toggleLikePost
  );
  router.post(
    "/posts/share/:id",
    isAuthenticated,
    checkPostStatus,
    toggleSharePost
  );
};
