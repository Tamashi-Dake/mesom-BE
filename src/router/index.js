import express from "express";
import authentication from "./authentication.js";
import users from "./users.js";

const router = express.Router();

export default () => {
  authentication(router);
  users(router);

  return router;
};
