import { Server, Socket } from 'socket.io'
import { EConversationSocketEvents } from '~/constrains/socket.enums.js'
import Message from '~/db/message.model.js'
import { IConversationModel, IMessageModel } from '~/types/models.types.js'

export const joinConversationHandler = (socket: Socket) => {
  socket.on(EConversationSocketEvents.joinConversation, (userId: string, conversationId: string) => {
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
export const leaveConversationHandler = (socket: Socket) => {
  socket.on(EConversationSocketEvents.leaveConversation, (userId: string, conversationId: string) => {
    if (!userId || !conversationId) return

    socket.leave(conversationId)
    console.log(`User ${userId} left conversation ${conversationId}`)
  })
}
export interface INewMessageEventProps {
  userId: string
  conversation: IConversationModel
  message: IMessageModel
}

export const newMessageHandler = (io: Server, socket: Socket) => {
  socket.on(EConversationSocketEvents.newMessage, async ({ userId, conversation, message }: INewMessageEventProps) => {
    if (!conversation?.participants) {
      return console.error('[HANDLER] No participants for', conversation?._id)
    }
    // Populate sender, reactions.user, replyTo
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'displayName username profile.avatarImg')
      .populate('reactions.user', 'username displayName')
      .populate('replyTo', 'text sender')

    io.to(conversation._id).emit(EConversationSocketEvents.newMessageReceived, {
      message: populatedMessage,
      conversationId: conversation._id,
      senderId: userId
    })

    // conversation?.participants.forEach((memberId) => {
    //   socket.in(memberId).emit(ENotificationSocketEvents.newMessageReceived, message)
    // })

    console.log(`User ${userId} sent a message to conversation ${conversation?._id}`)
  })
}
