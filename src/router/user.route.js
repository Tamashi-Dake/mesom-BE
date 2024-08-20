import {
  getUser,
  deleteUser,
  updateUser,
  toggleFollowUser,
  getSuggestedUsers,
  updatePassword,
} from "../controller/user.controller.js";
import { isAuthenticated, isOwner } from "../middlewares/index.js";

export default (router) => {
  // users routes
  router.get("/users/:id", isAuthenticated, getUser);
  router.delete("/users/:id", isAuthenticated, isOwner, deleteUser);
  router.patch("/users/:id", isAuthenticated, isOwner, updateUser);

  // update password
  router.patch("/password/:id", isAuthenticated, isOwner, updatePassword);

  // follow routes
  router.post("/follow/:id", isAuthenticated, toggleFollowUser);

  // get Suggested Users
  router.get("/users", isAuthenticated, getSuggestedUsers);
};
