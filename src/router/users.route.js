import {
  getUser,
  deleteUser,
  updateUser,
  toggleFollowUser,
} from "../controller/users.js";
import { isAuthenticated, isOwner } from "../middlewares/index.js";

export default (router) => {
  // users routes
  router.get("/users/:id", isAuthenticated, getUser);
  router.delete("/users/:id", isAuthenticated, isOwner, deleteUser);
  router.patch("/users/:id", isAuthenticated, isOwner, updateUser);

  // follow routes
  router.post("/follow/:id", isAuthenticated, toggleFollowUser);
};
