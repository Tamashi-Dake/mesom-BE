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

    // TODO: change to orther fields of user to update
    // get username from request body
    const { username } = request.body;
    if (!username) {
      return response
        .status(400)
        .json({ error: true, message: "Username is required" });
    }
    const user = await getUserById(id);
    user.username = username;
    await user.save();
    return response.status(200).json(user);
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }
};
