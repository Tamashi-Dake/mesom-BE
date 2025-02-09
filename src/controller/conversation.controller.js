import { v2 as cloudinary } from "cloudinary";

import Conversation from "../db/conversation.model.js";
import streamUpload from "../util/streamUpload.js";

export const createConversation = async (request, response) => {
  const { participants, name } = request.body;
  const { id: creatorID, verified } = request.identify;
  try {
    // Check if conversation with the same participants already exists, if true, return it
    const existingConversation = await Conversation.findOne({
      participants: { $all: [...participants, creatorID] },
      $expr: { $eq: [{ $size: "$participants" }, participants.length + 1] },
    });
    if (existingConversation) {
      return response.status(200).json(existingConversation);
    }

    // Check if participants array is empty
    if (participants.length === 0) {
      return response.status(400).json({
        message: "Please include at least one participant",
      });
    }
    // Check if participants array contains duplicates
    if (new Set(participants).size !== participants.length) {
      return response.status(400).json({
        message: "Each participant should not be included more than once",
      });
    }
    // Check if participants array contains creator
    if (participants.includes(creatorID)) {
      return response.status(400).json({
        message: "Creator should not be included as a participant",
      });
    }

    // Check if creator is verified, if true, allow them to create a conversation with more than 5, less than 10 participants
    if (!verified && participants.length > 4) {
      return response.status(400).json({
        message:
          "You need to be verified to create a conversation with more than 5 participants",
      });
    }
    if (participants.length > 9) {
      return response.status(400).json({
        message:
          "You can only create a conversation with a maximum of 10 participants",
      });
    }

    const conversation = await Conversation.create({
      name: name,
      // participants will always include creator
      isGroup: participants.length > 1 ? true : false,
      creator: creatorID,
      // include creator in participants
      participants: [...participants, creatorID],
    });

    response.status(201).json(conversation);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

export const getUserConversations = async (request, response) => {
  const userID = request.identify.id;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // Find all conversations where the current user is a participant
    const conversations = await Conversation.find({
      participants: userID,
      hiddenWith: { $ne: userID },
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate("participants", "profile.avatarImg")
      .populate("lastMessage", "content type isSeen createdAt");

    const totalConversations = await Conversation.countDocuments({
      participants: userID,
      hiddenWith: { $ne: userID },
    });
    const remainingConversations = totalConversations - skip - limit;
    const nextSkip = remainingConversations > 0 ? skip + limit : null;

    return response.status(200).json({
      conversations,
      totalConversations,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getConversation = async (request, response) => {
  const { id } = request.params;
  const currentUserId = request.identify.id;
  try {
    // Find the conversation by its ID and check if the current user is a participant
    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });
    if (!conversation) {
      return response.status(404).json({ error: "Conversation not found" });
    }

    // Return the conversation data if the current user is a participant
    return response.status(200).json(conversation);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const updateConversation = async (request, response) => {
  const currentUserId = request.identify.id;
  const { id } = request.params;
  const { name } = request.body;
  const files = request.files;
  try {
    // Find the conversation by its ID and check if the current user is the creator
    const conversation = await Conversation.findOne({
      _id: id,
      creator: currentUserId,
    });
    if (!conversation) {
      return response.status(404).json({ error: "Conversation not found" });
    }

    // Update the conversation name
    conversation.name = name;

    if (files.avatar && files.avatar.length > 0) {
      if (conversation.avatar) {
        await cloudinary.uploader.destroy(
          `Mesom/ConversationImage/${
            conversation.avatar.split("/").pop().split(".")[0]
          }`
        );
      }
      const avatarResult = await streamUpload(
        files.avatar[0].buffer,
        "Mesom/ConversationImage"
      );
      conversation.avatar = avatarResult.secure_url;
    }

    await conversation.save();

    return response.status(200).json(conversation);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const toggleHideConversation = async (request, response) => {
  const { id } = request.params;
  const currentUserId = request.identify.id;
  try {
    const conversation = await Conversation.findOne({
      _id: id,
      participants: currentUserId,
    });
    if (!conversation)
      return response.status(404).json({ error: "Conversation not found" });

    const isHidden = conversation.hiddenWith.includes(currentUserId);
    if (isHidden) {
      conversation.hiddenWith.pull(currentUserId);
    } else {
      conversation.hiddenWith.push(currentUserId);
    }
    await conversation.save();

    return response.status(200).json({
      message: `Conversation ${isHidden ? "Show" : "Hide"} successfully`,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};
