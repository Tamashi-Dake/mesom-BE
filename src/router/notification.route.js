import { getUserNotifications } from "../controller/notification.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

export default (router) => {
  // get all notifications
  router.get("/notifications", isAuthenticated, getUserNotifications);

  // mark notification as read / unread

  // delete notification

  // notification settings
  // don't send this type of notification

  // don't send notification from this post
};
