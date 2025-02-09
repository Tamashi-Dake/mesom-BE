import Conversation from "../db/conversation.model.js";
import Message from "../db/message.model.js";
import Setting from "../db/setting.model.js";
import uploadImagesToCloudinary from "../util/uploadImagesToCloudinary.js";
import validatePostData from "../util/validatePostData.js";

export const createMessage = async (request, response) => {
  const senderId = request.identify.id;
  const { id: conversationId } = request.params;
  const { text, type, replyTo } = request.body;
  const files = request.files;
  try {
    const validationError = validatePostData(text, files);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    const imageSecureURLs = await uploadImagesToCloudinary(
      files,
      "Mesom/MessageImage"
    );

    const conversation = await Conversation.findById(conversationId);

    // Check if participant contain sender
    if (!conversation.participants.includes(senderId))
      return response.status(403).json({
        message: "You are not a participant of this conversation.",
      });

    // Check if sender is blocked by recipient
    if (!conversation.isGroup) {
      const recipientSetting = await Setting.findOne({
        blockedUser: conversation.participants.filter(
          (participant) => participant !== senderId
        )[0],
      });
      if (recipientSetting.blockedUser.includes(senderId))
        return response.status(403).json({
          message: "You are blocked by the recipient.",
        });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      text,
      images: imageSecureURLs,
      type,
      replyTo,
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.totalMessages += 1;
    await conversation.save();

    return response.status(201).json(message);
  } catch (error) {
    console.error(error);
    return response.status(400).json({ message: "Error creating message" });
  }
};

export const getMessagesInConversation = async (request, response) => {
  const { id: conversationId } = request.params;
  const currentUserId = request.identify.id;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation.participants.includes(currentUserId)) {
      return response.status(403).json({
        message: "You are not a participant of this conversation.",
      });
    }
    const messages = await Message.find({ conversation: conversationId })
      // .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "displayName username profile.avatarImg")
      .populate("reactions.user", "username displayName")
      .populate("replyTo", "text sender");
    if (!messages || messages.length === 0) {
      return response.status(200).json({
        message: "This conversation have no messages.",
      });
    }

    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
    });
    const remainingMessages = totalMessages - skip - limit;
    const nextSkip = remainingMessages > 0 ? skip + limit : null;
    return response.status(200).json({
      messages,
      totalMessages,
      limit: limit,
      skip: skip,
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.error(error);
    return response.status(400).json({ message: "Error fetching messages" });
  }
};
