import {
  deleteAllNotifications,
  deleteNotification,
  getUserMentions,
  getUserNotifications,
  markAllNotificationsAsRead,
  toggleReadNotification,
} from "../controller/notification.controller.js";
import { isAuthenticated } from "../middlewares/index.js";

export default (router) => {
  // get all notifications
  router.get("/notifications", isAuthenticated, getUserNotifications);
  router.get("/notifications/mentions", isAuthenticated, getUserMentions);

  // mark notification as read / unread
  router.patch("/notifications/:id", isAuthenticated, toggleReadNotification);
  router.patch("/notifications", isAuthenticated, markAllNotificationsAsRead);

  // delete notification
  router.delete("/notifications/:id", isAuthenticated, deleteNotification);
  router.delete("/notifications", isAuthenticated, deleteAllNotifications);
};
