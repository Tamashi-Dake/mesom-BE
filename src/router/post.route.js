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

// import upload from "../config/uploadConfig.js";

export default (router) => {
  // Have to define the fixed routes first, because mongoose will mistake the fixed routes as dynamic routes
  // Post for pages route
  router.get("/posts", isAuthenticated, getAllPosts);
  router.get("/posts/following", isAuthenticated, getPostsByFollowing);
  // post routes
  router.post(
    "/posts",
    isAuthenticated,
    // upload.array("images", 4),
    createPost
  );
  router.get("/posts/:id", isAuthenticated, checkPostStatus, getPost);
  // router.patch("/posts/:id", isAuthenticated,  updatePost);
  router.delete("/posts/:id", isAuthenticated, checkPostStatus, deletePost);

  // reply routes
  // TODO: check author notification settings
  router.post(
    "/posts/:id",
    isAuthenticated,
    // checkUserNotificationSettings,
    createReplyPost
  );
  router.get(
    "/posts/replies/:id",
    isAuthenticated,
    checkPostStatus,
    getRepliesForPost
  );

  // Post by user routes
  router.get(
    "/posts/user/:id",
    isAuthenticated,
    checkUserStatus,
    getPostsByUser
  );
  router.get(
    "/posts/like/:id",
    isAuthenticated,
    checkUserStatus,
    getLikedPostsByUser
  );

  // interaction routes
  router.post(
    "/posts/like/:id",
    isAuthenticated,
    checkPostStatus,
    checkUserNotificationSettings,
    toggleLikePost
  );
  router.post(
    "/posts/share/:id",
    isAuthenticated,
    checkPostStatus,
    checkUserNotificationSettings,
    toggleSharePost
  );
  router.post(
    "/posts/incresase-view/:id",
    isAuthenticated,
    checkPostStatus,
    increasePostView
  );
};
