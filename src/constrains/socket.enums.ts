export enum EUserSocketEvents {
  setup = 'user:setup',
  online = 'user:online',
  userJoined = 'user:joined',
  userLeft = 'user:left'
}

export enum EConversationSocketEvents {
  joinConversation = 'conversation:join',
  leaveConversation = 'conversation:leave',
  newMessage = 'conversation:newMessage',
  newMessageReceived = 'conversation:newMessageReceived'
}
