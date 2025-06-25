export interface IConversationModel {
  _id: string
  name: string
  avatar: string
  creator: string
  isGroup: boolean
  participants: string[]
  totalMessages: number
  lastMessage?: string
  hiddenWith: string[]
}
export interface IMessageModel {
  _id: string
  conversation: string
  sender: IMessageSender
  text?: string
  images?: string[]
  type: string
  replyTo?: string
  isDeleted: boolean
  isSeen: boolean
  reactions?: IMessageReaction[]
  createdAt: string
  updatedAt?: string
}

export interface IMessageSender {
  profile: {
    avatarImg: string
  }
  _id: string
  displayName?: string
  username: string
}

export interface IMessageReaction {
  user: string
  reactions: string[]
}
