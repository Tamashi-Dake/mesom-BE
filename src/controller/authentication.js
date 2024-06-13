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

export const login = async (request, response) => {
  try {
    // get username and password from request body
    const { username, password } = request.body;

    // check if username or password is missing
    if (!username || !password) {
      return response
        .status(400)
        .json({ error: true, message: "Missing username or password" });
    }

    // check if user exists and get user authentication details
    const user = await getUserByUsername(username).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return response
        .status(400)
        .json({ error: true, message: "User does not exist" });
    }

    // check if password is correct
    const expectedHash = authentication(user.authentication.salt, password);
    if (expectedHash !== user.authentication.password) {
      return response
        .status(403)
        .json({ error: true, message: "Invalid password" });
    }

    // generate session token
    const salt = random();
    user.authentication.sessionToken = authentication(
      salt,
      user._id.toString()
    );

    // save session token
    await user.save();

    // set cookie
    response.cookie("mesom-auth", user.authentication.sessionToken, {
      // httpOnly: true, // Kích hoạt nếu dùng HTTPS
      // secure: true, // Kích hoạt nếu dùng HTTPS
      // sameSite: "none", // Điều chỉnh nếu cần thiết
      domain: "localhost",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });

    // return user
    return response.status(200).json(user).end();
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: true, message: "Error" });
  }
};
