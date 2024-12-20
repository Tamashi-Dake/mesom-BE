import Notification from "../db/notification.model.js";

export const getUserNotifications = async (request, response) => {
  const userId = request.identify._id.toString();
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // count all notifications sent to the user
    const totalNotifications = await Notification.countDocuments({
      to: userId,
      deleted: false,
      show: true,
    });
    if (totalNotifications === 0)
      return response
        .status(200)
        .json({ message: `You don't have any notifications` });

    // get all notifications sent to the user that are not deleted and are set to show
    const notifications = await Notification.find({
      to: userId,
      deleted: false,
      show: true,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .skip(skip)
      .populate(
        "from",
        "displayName username profile.avatarImg profile.coverImg profile.bio following followers"
      );
    if (!notifications || notifications.length === 0) {
      return response.status(404).json({ error: `No notifications found` });
    }

    const remainingNotifications = totalNotifications - skip - limit;
    const nextSkip = remainingNotifications > 0 ? skip + limit : null;

    return response.status(200).json({
      notifications,
      totalNotifications,
      limit,
      skip,
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error getting notifications` });
  }
};

export const getUserMentions = async (request, response) => {
  const userId = request.identify._id.toString();
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // count all notifications sent to the user
    const totalNotifications = await Notification.countDocuments({
      to: userId,
      type: "reply",
      deleted: false,
      show: true,
    });
    if (totalNotifications === 0)
      return response
        .status(200)
        .json({ message: `You don't have any mentions` });

    // get all mentions sent to the user that are not deleted and are set to show
    const mentions = await Notification.find({
      to: userId,
      type: "reply",
      deleted: false,
      show: true,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .skip(skip)
      .populate(
        "from",
        "displayName username profile.avatarImg profile.coverImg profile.bio following followers"
      )
      .populate("post");
    if (!mentions || mentions.length === 0) {
      return response.status(404).json({ error: `No mentions found` });
    }

    const remainingNotifications = totalNotifications - skip - limit;
    const nextSkip = remainingNotifications > 0 ? skip + limit : null;

    return response.status(200).json({
      mentions,
      totalNotifications,
      limit,
      skip,
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error getting mentions` });
  }
};

export const toggleReadNotification = async (request, response) => {
  const userId = request.identify._id.toString();
  const notificationId = request.params.id;
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      to: userId,
    });
    if (!notification) {
      return response
        .status(404)
        .json({ error: `Notification ${notificationId} not found` });
    }

    // Toggle the read status of the notification
    const read = !notification.read;
    await Notification.updateOne(
      { _id: notificationId },
      {
        read,
      }
    );
    return response.status(200).json({
      message: `Notification ${notificationId} marked as ${
        read ? "read" : "unread"
      }`,
    });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: `Error marking notification ${notificationId} as read` });
  }
};

export const markAllNotificationsAsRead = async (request, response) => {
  const userId = request.identify._id.toString();
  try {
    const notifications = await Notification.updateMany(
      { to: userId },
      { read: true },
      { multi: true }
    );
    return response
      .status(200)
      .json({ notifications, message: `All notifications marked as read` });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: `Error marking all notifications as read` });
  }
};

export const deleteNotification = async (request, response) => {
  const userId = request.identify._id.toString();
  const notificationId = request.params.id;
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      to: userId,
    });
    if (!notification) {
      return response
        .status(404)
        .json({ error: `Notification ${notificationId} not found` });
    }

    // Update the notification to set deleted = true and deletedAt to current date and time
    const result = await Notification.updateOne(
      { _id: notificationId },
      {
        deleted: true,
        deletedAt: new Date(), // Set the current date and time for deletedAt
      }
    );

    if (result.modifiedCount === 0) {
      console.error(
        "No document was updated. Check if the conditions are correct."
      );
      return response
        .status(500)
        .json({ error: "Failed to update notification" });
    }

    return response
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: `Error deleting notification ${notificationId}` });
  }
};

export const deleteAllNotifications = async (request, response) => {
  const userId = request.identify._id.toString();
  try {
    // Update all notifications to set deleted = true and deletedAt to current date and time
    await Notification.updateMany(
      { to: userId },
      {
        deleted: true,
        deletedAt: new Date(), // Set the current date and time for deletedAt
      }
    );
    return response.status(200).json({ message: `All notifications deleted` });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: `Error deleting all notifications` });
  }
};
