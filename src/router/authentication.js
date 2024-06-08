import { register } from "../controller/authentication.js";

export default (router) => {
  router.post("/auth/register", register);
};
