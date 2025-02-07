import {
  checkConversationStatus,
  isAuthenticated,
} from "../middlewares/index.js";
import {
  createConversation,
  getConversation,
  getUserConversations,
  toggleHideConversation,
  updateConversation,
} from "../controller/conversation.controller.js";

import upload from "../config/uploadConfig.js";

export default (router) => {
  router.post("/conversation", isAuthenticated, createConversation);

  router.get("/conversations", isAuthenticated, getUserConversations);
  router.get(
    "/conversation/:id",
    isAuthenticated,
    checkConversationStatus,
    getConversation
  );

  router.patch(
    "/conversation/:id",
    isAuthenticated,
    checkConversationStatus,
    upload.fields([{ name: "avatar" }]),
    updateConversation
  );

  // router.delete(
  //   "/conversation/:id",
  //   isAuthenticated,
  //   checkConversationStatus,
  //   deleteConversation
  // );

  // // TODO: update message icon for notification?

  // interaction routes
  router.post(
    "/conversation/:id/hide",
    isAuthenticated,
    checkConversationStatus,
    toggleHideConversation
  );
};
