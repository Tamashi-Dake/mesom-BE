import {
  getUserFromUsername,
  deleteUser,
  updateUser,
  toggleFollowUser,
  getSuggestedUsers,
  updatePassword,
} from "../controller/user.controller.js";
import {
  checkUserNotificationSettings,
  checkUserStatus,
  isAuthenticated,
  isOwner,
} from "../middlewares/index.js";

import upload from "../config/uploadConfig.js";

export default (router) => {
  // user routes
  router.get("/user/:username", isAuthenticated, getUserFromUsername);
  router.patch(
    "/user/:id",
    isAuthenticated,
    upload.fields([{ name: "avatarImg" }, { name: "coverImg" }]),
    isOwner,
    updateUser
  );
  router.delete("/user/:id", isAuthenticated, isOwner, deleteUser);

  // TODO: move to auth route
  // update password
  router.patch("/password/:id", isAuthenticated, isOwner, updatePassword);

  // follow routes
  router.post(
    "/follow/:id",
    isAuthenticated,
    checkUserStatus,
    checkUserNotificationSettings,
    toggleFollowUser
  );

  // get Suggested Users
  router.get("/users", isAuthenticated, getSuggestedUsers);
};
