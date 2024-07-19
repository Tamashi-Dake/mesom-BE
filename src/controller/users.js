import { getUsers, deleteUserById, getUserById } from "../db/user.js";

export const getAllUsers = async (request, response) => {
  try {
    const users = await getUsers();
    return response.status(200).json({
      users,
    });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: true, message: `Error: ${error}` });
  }
};

export const deleteUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await deleteUserById(id);
    return response.status(200).json({
      message: `User with id ${id} deleted`,
    });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: true, message: `Error: ${error}` });
  }
};

export const updateUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await getUserById(id);

    // get update info from request body
    const { username, displayName, profile } = request.body;
    if (!username || !displayName) {
      return response
        .status(400)
        .json({
          error: true,
          message: "Username and Display name is required",
        });
    }

    user.username = username;
    user.displayName = displayName;
    if (profile) {
      if (profile.dob) user.profile.dob = profile.dob;
      if (profile.location) user.profile.location = profile.location;
      if (profile.avatar) user.profile.avatar = profile.avatar;
      if (profile.banner) user.profile.banner = profile.banner;
      if (profile.bio) user.profile.bio = profile.bio;
    }

    await user.save();
    return response.status(200).json(user);
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }
};
