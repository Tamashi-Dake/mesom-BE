import Conversation from '../db/conversation.model.js'
import Message from '../db/message.model.js'
import Setting from '../db/setting.model.js'
import getMessageType from '../util/getMessageType.js'
import uploadImagesToCloudinary from '../util/uploadImagesToCloudinary.js'
import validatePostData from '../util/validatePostData.js'

export const createMessage = async (request, response) => {
  const senderId = request.identify.userId
  const { id: conversationId } = request.params
  const { text, replyTo } = request.body
  const files = request.files

  try {
    const validationError = validatePostData(text, files)
    const messageType = getMessageType(text, files)
    if (validationError) {
      return response.status(400).json(validationError)
    }

    const imageSecureURLs = await uploadImagesToCloudinary(files, 'Mesom/MessageImage')

    const conversation = await Conversation.findById(conversationId)

    // Check if participant contain sender
    if (!conversation.participants.includes(senderId))
      return response.status(403).json({
        message: 'You are not a participant of this conversation.'
      })

    // Check if sender is blocked by recipient
    if (!conversation.isGroup) {
      const recipientId = conversation.participants.find((participant) => participant.toString() !== senderId)
      if (recipientId) {
        const recipientSetting = await Setting.findOne({ user: recipientId })
        if (recipientSetting.blockedUser.includes(senderId))
          return response.status(403).json({
            message: 'You are blocked by the recipient.'
          })
      }
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
      images: imageSecureURLs,
      type: messageType,
      replyTo
    })

    // Update conversation
    conversation.lastMessage = message._id
    conversation.totalMessages += 1
    await conversation.save()

    return response.status(201).json(message)
  } catch (error) {
    console.error(error)
    return response.status(400).json({ message: 'Error creating message' })
  }
}

export const getMessagesInConversation = async (request, response) => {
  const { id: conversationId } = request.params
  const currentUserId = request.identify.userId
  const limit = parseInt(request.query.limit) || 10
  const skip = parseInt(request.query.skip) || 0

  try {
    const conversation = await Conversation.findById(conversationId)
    if (!conversation.participants.includes(currentUserId)) {
      return response.status(403).json({
        message: 'You are not a participant of this conversation.'
      })
    }

    // Lấy tổng số message trước
    const totalMessages = await Message.countDocuments({
      conversation: conversationId
    })

    // Sắp xếp theo createdAt giảm dần để lấy message mới nhất trước
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 }) // Message mới nhất trước
      .skip(skip)
      .limit(limit)
      .populate('sender', 'displayName username profile.avatarImg')
      .populate('reactions.user', 'username displayName')
      .populate('replyTo', 'text sender')

    if (!messages || messages.length === 0) {
      return response.status(200).json({
        message: 'This conversation have no messages.',
        messages: [],
        totalMessages,
        limit,
        skip,
        nextSkip: null
      })
    }

    // Đảo ngược mảng để hiển thị message cũ nhất trước trong UI
    const reversedMessages = messages.reverse()

    const remainingMessages = totalMessages - skip - limit
    const nextSkip = remainingMessages > 0 ? skip + limit : null

    return response.status(200).json({
      messages: reversedMessages,
      totalMessages,
      limit,
      skip,
      nextSkip,
      hasMore: nextSkip !== null
    })
  } catch (error) {
    console.error(error)
    return response.status(400).json({ message: 'Error fetching messages' })
  }
}
