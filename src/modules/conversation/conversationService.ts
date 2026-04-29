import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

import { SettingService } from '~/modules/setting/settingService.js'
import _Conversation from '~/db/conversation.model.js'
import _Message from '~/db/message.model.js'
import { getUserById as _getUserById } from '~/db/user.model.js'
import streamUpload from '~/util/streamUpload.js'
import uploadImagesToCloudinary from '~/util/uploadImagesToCloudinary.js'
import getMessageType from '~/util/getMessageType.js'

type AnyQuery = any
const Conversation = _Conversation as {
  find: (filter: unknown) => AnyQuery
  findById: (id: unknown) => AnyQuery
  findOne: (filter: unknown) => AnyQuery
  countDocuments: (filter: unknown) => Promise<number>
  create: (doc: unknown) => Promise<any>
}
const Message = _Message as {
  find: (filter: unknown) => AnyQuery
  countDocuments: (filter: unknown) => Promise<number>
  create: (doc: unknown) => Promise<any>
}
const getUserById = _getUserById as (id: string) => AnyQuery

@Injectable()
export class ConversationService {
  constructor(private readonly settings: SettingService) {}

  async checkCreateConditions(creatorId: string, participants: string[]) {
    const creator = await getUserById(creatorId)
    if (!creator) throw new NotFoundException('Creator not found')

    const allParticipants = [...new Set([...participants, creatorId])].sort()

    const existingConversation = await Conversation.findOne({
      participants: { $all: allParticipants },
      $expr: { $eq: [{ $size: '$participants' }, allParticipants.length] }
    })
    if (existingConversation) return existingConversation

    if (participants.length === 0) {
      throw new BadRequestException('Please include at least one participant')
    }
    if (new Set(participants).size !== participants.length) {
      throw new BadRequestException('Each participant should not be included more than once')
    }
    if (participants.includes(creatorId) && participants.length > 1) {
      throw new BadRequestException('Creator should not be included as a participant')
    }
    if (!creator.verified && participants.length > 4) {
      throw new BadRequestException(
        'You need to be verified to create a conversation with more than 5 participants'
      )
    }
    if (participants.length > 9) {
      throw new BadRequestException(
        'You can only create a conversation with a maximum of 10 participants'
      )
    }

    return { message: 'Conditions met, you can create a conversation' }
  }

  async createConversation(creatorId: string, participants: string[], name?: string) {
    const conversation = await Conversation.create({
      name,
      isGroup: participants.length > 1,
      creator: creatorId,
      participants: participants.includes(creatorId) ? participants : [...participants, creatorId]
    })
    return conversation
  }

  async getUserConversations(userId: string, limit: number, skip: number) {
    const filter = { participants: userId, hiddenWith: { $ne: userId } }
    const conversations = await Conversation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('participants', 'profile.avatarImg')
      .populate('lastMessage', 'content type isSeen createdAt')

    const totalConversations = await Conversation.countDocuments(filter)
    const remaining = totalConversations - skip - limit
    return {
      conversations,
      totalConversations,
      limit,
      skip,
      nextSkip: remaining > 0 ? skip + limit : null
    }
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    })
    if (!conversation) throw new NotFoundException('Conversation not found')
    return conversation
  }

  async updateConversation(
    userId: string,
    conversationId: string,
    name: string | undefined,
    avatarFile: Express.Multer.File | undefined
  ) {
    const conversation = await Conversation.findOne({ _id: conversationId, creator: userId })
    if (!conversation) throw new NotFoundException('Conversation not found')

    if (name) conversation.name = name

    if (avatarFile) {
      if (conversation.avatar) {
        const publicId = conversation.avatar.split('/').pop()?.split('.')[0]
        if (publicId) {
          await cloudinary.uploader.destroy(`Mesom/ConversationImage/${publicId}`)
        }
      }
      const result = await streamUpload(avatarFile.buffer, 'Mesom/ConversationImage')
      conversation.avatar = result.secure_url
    }

    await conversation.save()
    return conversation
  }

  async toggleHideConversation(userId: string, conversationId: string) {
    const conversation = await Conversation.findOne({ _id: conversationId, participants: userId })
    if (!conversation) throw new NotFoundException('Conversation not found')

    const isHidden = conversation.hiddenWith.includes(userId)
    if (isHidden) {
      conversation.hiddenWith.pull(userId)
    } else {
      conversation.hiddenWith.push(userId)
    }
    await conversation.save()
    return { message: `Conversation ${isHidden ? 'Show' : 'Hide'} successfully` }
  }

  // ── Message methods ───────────────────────────────────────────────────────

  async createMessage(
    senderId: string,
    conversationId: string,
    text: string | undefined,
    files: Express.Multer.File[],
    replyTo?: string
  ) {
    if (!text && files.length === 0) {
      throw new BadRequestException('Please provide text or image in the message')
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) throw new NotFoundException('Conversation not found')

    const isParticipant = conversation.participants.some(
      (p: { toString: () => string }) => p.toString() === senderId
    )
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation.')
    }

    if (!conversation.isGroup) {
      const recipientId = conversation.participants.find(
        (p: { toString: () => string }) => p.toString() !== senderId
      )
      if (recipientId) {
        const blockedIds = await this.settings.getBlockedUserIds(recipientId.toString())
        const isBlocked = (blockedIds as Array<{ toString: () => string }>).some(
          (id) => id.toString() === senderId
        )
        if (isBlocked) throw new ForbiddenException('You are blocked by the recipient.')
      }
    }

    const imageSecureURLs = await uploadImagesToCloudinary(files, 'Mesom/MessageImage')
    const messageType = getMessageType(text ?? '', files)

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
      images: imageSecureURLs,
      type: messageType,
      replyTo: replyTo ?? null
    })

    conversation.lastMessage = message._id
    conversation.totalMessages += 1
    await conversation.save()

    return message
  }

  async getMessages(userId: string, conversationId: string, limit: number, skip: number) {
    const conversation = await Conversation.findById(conversationId)
    if (!conversation) throw new NotFoundException('Conversation not found')

    const isParticipant = conversation.participants.some(
      (p: { toString: () => string }) => p.toString() === userId
    )
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant of this conversation.')
    }

    const totalMessages = await Message.countDocuments({ conversation: conversationId })
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'displayName username profile.avatarImg')
      .populate('reactions.user', 'username displayName')
      .populate('replyTo', 'text sender')

    if (!messages || messages.length === 0) {
      return { messages: [], totalMessages, limit, skip, nextSkip: null, hasMore: false }
    }

    const reversedMessages = [...messages].reverse()
    const remaining = totalMessages - skip - limit
    const nextSkip = remaining > 0 ? skip + limit : null

    return { messages: reversedMessages, totalMessages, limit, skip, nextSkip, hasMore: nextSkip !== null }
  }
}
