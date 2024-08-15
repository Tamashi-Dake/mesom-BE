import express from "express";
import authentication from "./authentication.route.js";
import users from "./users.route.js";

const router = express.Router();

export default () => {
  authentication(router);
  users(router);

  return router;
};
