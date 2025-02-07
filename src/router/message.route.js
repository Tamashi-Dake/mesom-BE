import {
  checkConversationStatus,
  // checkMessageStatus,
  isAuthenticated,
} from "../middlewares/index.js";

import upload from "../config/uploadConfig.js";
import {
  createMessage,
  getMessagesInConversation,
} from "../controller/message.controller.js";

export default (router) => {
  router.post(
    "/conversation/:id/message",
    isAuthenticated,
    checkConversationStatus,
    upload.array("images", 4),
    createMessage
  );

  router.get(
    "/conversation/:id/messages",
    isAuthenticated,
    checkConversationStatus,
    getMessagesInConversation
  );
  // Lấy số lượng tin nhắn chưa đọc
  // router.get("/unread-messages", isAuthenticated, getUnreadMessagesCount);

  //   router.delete("/message/:messageId", isAuthenticated, deleteMessage);

  // Interactions routes
  //   router.patch("/message/:messageId/read", isAuthenticated, markMessageAsRead);
  //   router.patch("/message/:messageId/react", isAuthenticated, reactToMessage);
};
