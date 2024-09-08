import {
  login,
  register,
  logout,
  getCurrentUser,
} from "../controller/authentication.controller.js";

export default (router) => {
  router.post("/auth/register", register);
  router.post("/auth/login", login);
  router.post("/auth/logout", logout);
  router.get("/auth/me", getCurrentUser);
};
