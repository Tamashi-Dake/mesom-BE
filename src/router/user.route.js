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

export default (router) => {
  // users routes
  router.get("/users/:username", isAuthenticated, getUserFromUsername);
  router.patch("/users/:id", isAuthenticated, isOwner, updateUser);
  router.delete("/users/:id", isAuthenticated, isOwner, deleteUser);

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
