import {
  createPost,
  createReplyPost,
  deletePost,
  getAllPosts,
  getLikedPostsByUser,
  getPost,
  getPostsByFollowing,
  getPostsByUser,
  getRepliesForPost,
  increasePostView,
  toggleLikePost,
  toggleSharePost,
} from "../controller/post.controller.js";
import {
  checkPostStatus,
  checkUserNotificationSettings,
  checkUserStatus,
  isAuthenticated,
} from "../middlewares/index.js";

import upload from "../config/uploadConfig.js";

export default (router) => {
  // Post for pages route
  router.get("/posts", isAuthenticated, getAllPosts);
  router.get("/posts/following", isAuthenticated, getPostsByFollowing);

  // post routes
  router.get(
    "/post/:id",
    isAuthenticated,
    // validateId,
    checkPostStatus,
    getPost
  );
  router.post("/post", isAuthenticated, upload.array("images", 4), createPost);
  // router.patch("/post/:id", isAuthenticated,  updatePost);
  router.delete("/post/:id", isAuthenticated, checkPostStatus, deletePost);

  // reply routes
  // TODO: move post id before the replies
  router.get(
    "/post/:id/replies",
    isAuthenticated,
    checkPostStatus,
    getRepliesForPost
  );
  router.post(
    "/post/:id",
    isAuthenticated,
    // dùng multer trước khi động vào FormData
    upload.array("images", 4),
    checkPostStatus,
    // chọc vào Formdata nên PHẢI dùng sau multer
    checkUserNotificationSettings,
    createReplyPost
  );

  // Post by user routes
  router.get(
    "/users/:id/posts",
    isAuthenticated,
    checkUserStatus,
    getPostsByUser
  );
  router.get(
    "/user/:id/likes",
    isAuthenticated,
    checkUserStatus,
    getLikedPostsByUser
  );

  // interaction routes
  router.post(
    "/post/:id/like",
    isAuthenticated,
    checkPostStatus,
    checkUserNotificationSettings,
    toggleLikePost
  );
  router.post(
    "/post/:id/share",
    isAuthenticated,
    checkPostStatus,
    checkUserNotificationSettings,
    toggleSharePost
  );
  router.post(
    "/post/:id/increase-view",
    isAuthenticated,
    checkPostStatus,
    increasePostView
  );
};

// export const validateId = (req, res, next) => {
//   const { id } = req.params;

//   // Kiểm tra nếu id không hợp lệ
//   if (!id || typeof id !== "string" || id.length !== 24) {
//     console.log("error here");
//     return res.status(400).json({ error: true, message: "Invalid Post ID" });
//   }

//   next();
// };
