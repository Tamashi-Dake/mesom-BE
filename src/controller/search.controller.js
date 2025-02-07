import Conversation from "../db/conversation.model.js";
import { User } from "../db/user.model.js";

export const searchUsers = async (request, response) => {
  const { query } = request.query;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } },
      ],
    })
      .select("-bookmarks -pinnedPost")
      .skip(skip)
      .limit(limit);
    if (!users || users.length === 0) {
      return response.status(200).json({ message: "No users found" });
    }

    const totalUsers = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { displayName: { $regex: query, $options: "i" } },
      ],
    });
    const remainingUsers = totalUsers - skip - limit;
    const nextSkip = remainingUsers > 0 ? skip + limit : null;

    return response.status(200).json({
      users,
      totalUsers,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    return response.status(400).json({ error: "Something went wrong" });
  }
};

export const searchConversations = async (request, response) => {
  const userID = request.identify.id;
  const { query } = request.query;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    const conversations = await Conversation.find({
      name: { $regex: query, $options: "i" },
      participants: userID,
    })
      .populate("participants", "displayName username profile.avatarImg")
      .populate("lastMessage", "text type createdAt ")
      .skip(skip)
      .limit(limit);

    if (!conversations || conversations.length === 0) {
      return response.status(200).json({ message: "No conversations found" });
    }

    const totalConversations = await Conversation.countDocuments({
      name: { $regex: query, $options: "i" },
      participants: userID,
    });
    const remainingConversations = totalConversations - skip - limit;
    const nextSkip = remainingConversations > 0 ? skip + limit : null;

    return response.status(200).json({
      conversations,
      totalConversations,
      limit: limit,
      skip: skip,
      nextSkip: nextSkip,
    });
  } catch (error) {
    return response.status(400).json({ error: "Something went wrong" });
  }
};
