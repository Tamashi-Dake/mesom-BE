import { createPost, deletePost } from "../controller/post.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

// import upload from "../config/uploadConfig.js";

export default (router) => {
  // post routes
  router.post(
    "/posts",
    isAuthenticated,
    // upload.array("images", 4),
    createPost
  );
  // router.get("/posts", isAuthenticated, getAllPosts); // get all posts, need lazy loading
  // router.get("/posts/:id", isAuthenticated, getPost);
  // router.patch("/posts/:id", isAuthenticated,  updatePost);
  router.delete("/posts/:id", isAuthenticated, deletePost);
};
