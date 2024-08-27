import Notification from "../db/notification.model.js";

export const getUserNotifications = async (request, response) => {
  const userId = request.identify._id.toString();
  const { limit = 50, skip = 0 } = request.query;
  try {
    // count all notifications sent to the user
    const totalNotifications = await Notification.countDocuments({
      to: userId,
    });

    // get all notifications sent to the user
    const notifications = await Notification.find({ to: userId })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .skip(skip)
      .populate("from", "displayName username profile.avatar");
    if (!notifications) {
      return response
        .status(400)
        .json({ error: `No notifications found for user ${userId}` });
    }
    return response.status(200).json({
      notifications,
      totalNotifications,
      limit,
      skip,
      numberOfNotificationsFetched: Math.min(
        parseInt(skip) + parseInt(limit),
        totalNotifications
      ),
    });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: `Error getting notifications for user ${userId}` });
  }
};
