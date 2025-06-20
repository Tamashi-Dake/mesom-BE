import { conversationEvents } from "../../../constrains/socket.js";

export const joinConversationHandler = (socket) => {
  socket.on(conversationEvents.joinConversation, (userId, conversation) => {
    if (!userId || !conversation) {
      console.error("Invalid parameters for join conversation event", {
        userId,
        conversation,
      });
      return;
    }
    socket.join(conversation);
    console.log(`User ${userId} joined conversation ${conversation}`);
  });
};

export const newMessageHandler = (socket) => {
  socket.on(
    conversationEvents.newMessage,
    (userId, conversation, newMessage) => {
      console.log(
        `User ${userId} sent a message ${newMessage} to conversation ${conversation}`
      );
    }
  );
};
