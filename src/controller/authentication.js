import { createUser, getUserByUsername } from "../db/user.js";
import { authentication, random } from "../helper/index.js";

export const register = async (request, response) => {
  try {
    // Get username and password from request body
    const { username, password } = request.body;

    // Check if username or password is missing
    if (!username || !password) {
      return response
        .status(400)
        .json({ error: true, message: "Missing username or password" });
    }

    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      return response
        .status(400)
        .json({ error: true, message: "User already exists" });
    }

    // Generate salt
    const salt = random();

    // Create user
    const user = await createUser({
      username,
      authentication: {
        salt,
        password: authentication(salt, password),
      },
    });

    return response.status(200).json({
      error: false,
      message: "Success",
      registerResult: {
        userId: user._id.toString(),
        name: user.name,
      },
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: true, message: "Error" });
  }
};
