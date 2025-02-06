import {
  getDisplaySetting,
  getSetting,
  updateDisplaySetting,
  updateSetting,
} from "../controller/setting.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

export default (router) => {
  // get user Setting
  router.get("/settings", isAuthenticated, getSetting);
  router.get("/settings/display", isAuthenticated, getDisplaySetting);

  // update user Setting
  router.patch("/settings", isAuthenticated, updateSetting);
  router.patch("/settings/display", isAuthenticated, updateDisplaySetting);

  // // Notification preferences

  // // update blocked types
  // router.patch("/setting/blocked-types", isAuthenticated, updateBlockedTypes);

  // // update blocked posts
  // router.patch("/setting/blocked-posts", isAuthenticated, updateBlockedPosts);
};
