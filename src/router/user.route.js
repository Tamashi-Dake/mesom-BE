import {
  getUserFromUsername,
  deleteUser,
  updateUser,
  toggleFollowUser,
  getSuggestedUsers,
  toggleBlockUser,
} from "../controller/user.controller.js";
import {
  checkUserNotificationSettings,
  checkUserStatus,
  isAuthenticated,
} from "../middlewares/index.js";

import upload from "../config/uploadConfig.js";

export default (router) => {
  // user routes
  router.get("/user/:username", isAuthenticated, getUserFromUsername);
  // get Suggested Users
  router.get("/users", isAuthenticated, getSuggestedUsers);

  router.patch(
    "/user",
    isAuthenticated,
    upload.fields([{ name: "avatarImg" }, { name: "coverImg" }]),
    updateUser
  );

  router.delete("/user", isAuthenticated, deleteUser);

  // follow routes
  router.post(
    "/follow/:id",
    isAuthenticated,
    checkUserStatus,
    checkUserNotificationSettings,
    toggleFollowUser
  );
  // block routes
  router.post("/block/:id", isAuthenticated, checkUserStatus, toggleBlockUser);
};
