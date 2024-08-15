import { getUser, deleteUser, updateUser } from "../controller/users.js";
import { isAuthenticated, isOwner } from "../middlewares/index.js";

export default (router) => {
  router.get("/users/:id", isAuthenticated, getUser);
  router.delete("/users/:id", isAuthenticated, isOwner, deleteUser);
  router.patch("/users/:id", isAuthenticated, isOwner, updateUser);
};
