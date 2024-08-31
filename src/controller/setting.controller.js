import Setting from "../db/setting.model.js";

export const getSetting = async (request, response) => {
  const userId = request.identify._id.toString();
  try {
    // Find the user setting
    const setting = await Setting.findOne({
      user: userId,
    });
    if (!setting) {
      return response.status(404).json({ message: "Setting not found" });
    }
    return response.status(200).json({ setting });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Error while fetching user setting" });
  }
};

export const updateSetting = async (request, response) => {
  const userId = request.identify._id.toString();
  const { setting } = request.body;

  try {
    // Find the user setting
    const userSetting = await Setting.findOne({ user: userId });
    if (!userSetting) {
      return response.status(404).json({ message: "Setting not found" });
    }

    // Update settings
    const updateData = {
      ...setting,
    };

    // // Update settings
    // const updateData = {};

    // if (setting.blockedUser) {
    //   updateData["blockedUser"] = setting.blockedUser;
    // }

    // if (setting.notificationPreferences) {
    //   if (setting.notificationPreferences.blockedType) {
    //     updateData["notificationPreferences.blockedType"] =
    //       setting.notificationPreferences.blockedType;
    //   }
    //   if (setting.notificationPreferences.blockedPost) {
    //     updateData["notificationPreferences.blockedPost"] =
    //       setting.notificationPreferences.blockedPost;
    //   }
    // }

    // if (setting.themePreferences) {
    //   updateData["themePreferences"] = setting.themePreferences;
    // }

    await Setting.updateOne({ user: userId }, { $set: updateData });

    return response
      .status(200)
      .json({ message: "Setting updated successfully" });
  } catch (error) {
    return response
      .status(400)
      .json({ message: "Error while updating user setting" });
  }
};
