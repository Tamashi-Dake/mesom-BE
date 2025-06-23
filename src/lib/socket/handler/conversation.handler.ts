import { Socket } from 'socket.io'
import { EConversationEvents } from '~/constrains/socket.enums.js'
// import { EConversationEvents } from "../../../constrains/socket.enums.js";

export const joinConversationHandler = (socket: Socket) => {
  socket.on(EConversationEvents.joinConversation, (userId, conversationId) => {
    if (!userId || !conversationId) {
      console.error('Invalid parameters for join conversation event', {
        userId,
        conversationId
      })
      return
    }
    socket.join(conversationId)
    console.log(`User ${userId} joined conversation ${conversationId}`)
  })
}

export const newMessageHandler = (socket: Socket) => {
  socket.on(EConversationEvents.newMessage, (userId, conversation, newMessage) => {
    console.log(`User ${userId} sent a message ${newMessage} to conversation ${conversation}`)
  })
}
