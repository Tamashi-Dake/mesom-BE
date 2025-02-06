import {
  searchConversations,
  searchUsers,
} from "../controller/search.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

export default (router) => {
  router.get("/search/users", isAuthenticated, searchUsers);
  router.get("/search/conversations", isAuthenticated, searchConversations);
};
