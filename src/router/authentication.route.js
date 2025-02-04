import {
  login,
  register,
  logout,
  getCurrentUser,
  updatePassword,
} from "../controller/authentication.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

export default (router) => {
  router.get("/auth/me", getCurrentUser);
  router.post("/auth/register", register);
  router.post("/auth/login", login);
  router.post("/auth/logout", logout);
  router.patch("/password", isAuthenticated, updatePassword);
};
