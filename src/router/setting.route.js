import { getSetting, updateSetting } from "../controller/setting.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

export default (router) => {
  // get user Setting
  router.get("/setting", isAuthenticated, getSetting);

  // update user Setting
  router.patch("/setting", isAuthenticated, updateSetting);

  // // Blocked users
  // // update blocked users
  // router.patch("/setting/blocked-users", isAuthenticated, updateBlockedUsers);

  // // Notification preferences

  // // update blocked types
  // router.patch("/setting/blocked-types", isAuthenticated, updateBlockedTypes);

  // // update blocked posts
  // router.patch("/setting/blocked-posts", isAuthenticated, updateBlockedPosts);

  // // Theme preferences

  // // update theme
  // router.patch("/setting/theme", isAuthenticated, updateTheme);

  // // update accent color
  // router.patch("/setting/accent-color", isAuthenticated, updateAccentColor);
};
