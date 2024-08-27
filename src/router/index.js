import express from "express";
import authentication from "./authentication.route.js";
import users from "./user.route.js";
import post from "./post.route.js";
import notification from "./notification.route.js";

const router = express.Router();

export default () => {
  authentication(router);
  users(router);
  post(router);
  notification(router);
  return router;
};
