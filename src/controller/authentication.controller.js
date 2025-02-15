import Setting from "../db/setting.model.js";
import {
  createUser,
  getUserByUsername,
  getUserBySessionToken,
} from "../db/user.model.js";
import { authentication, random } from "../util/authenticationCrypto.js";
import validatePassword from "../util/validatePassword.js";

export const register = async (request, response) => {
  try {
    // Get username and password from request body
    const { username, password, confirmPassword } = request.body;

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

    const validationError = validatePassword(password, confirmPassword);

    if (validationError) {
      return response.status(400).json(validationError);
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

    // Create user settings
    const userSettings = await Setting.create({
      user: user._id.toString(),
    });

    await userSettings.save();

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
    return response.status(400).json({ error: `Error registering user` });
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
      "+authentication.salt +authentication.password -bookmarks -profile -following -followers"
    );

    if (!user) {
      return response
        .status(404)
        .json({ error: true, message: "Login: User does not exist" });
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
      httpOnly: true, // Chỉ cho phép đọc cookie từ phía máy chủ ( tránh XSS attacks )
      secure: process.env.NODE_ENV !== "development", // Chỉ gửi cookie qua HTTPS
      sameSite: process.env.NODE_ENV !== "development" ? "None" : "strict",
      // domain:
      //   process.env.NODE_ENV !== "development"
      //     ? process.env.COOKIE_DOMAIN
      //     : "localhost",
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

export const logout = async (request, response) => {
  try {
    const sessionToken = request.cookies["mesom-auth"];

    // Kiểm tra xem sessionToken có tồn tại hay không
    if (!sessionToken) {
      return response
        .status(400)
        .json({ error: true, message: "No session token found" });
    }

    // Tìm người dùng theo session token
    const user = await getUserBySessionToken(sessionToken);

    if (!user) {
      return response
        .status(400)
        .json({ error: true, message: "User not found" });
    }

    // Xóa session token
    user.authentication.sessionToken = null;

    // Lưu thay đổi
    await user.save();

    // Xóa cookie
    response.cookie("mesom-auth", "", {
      domain: process.env.COOKIE_DOMAIN || "localhost",
      path: "/",
      maxAge: 0, // Cookie sẽ hết hạn ngay lập tức
    });

    // Trả về phản hồi thành công
    return response.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: true, message: "Error logging out" });
  }
};

export const getCurrentUser = async (request, response) => {
  try {
    // get session token from request cookies
    const sessionToken = request.cookies["mesom-auth"];

    // check if session token is missing
    if (!sessionToken) {
      return response
        .status(401)
        .json({ error: true, message: "Unauthorized" });
    }

    // get current user by session token
    const currentUser = await getUserBySessionToken(sessionToken);
    if (!currentUser) {
      return response
        .status(400)
        .json({ error: true, message: "Auth: User does not exist" });
    }

    // return current user
    return response.status(200).json(currentUser);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: "Error getting current user" });
  }
};

export const updatePassword = async (request, response) => {
  const { username } = request.identify;

  let { oldPassword, newPassword, confirmPassword } = request.body;
  try {
    // check if user exists and get user authentication details
    const user = await getUserByUsername(username).select(
      "+authentication.salt +authentication.password"
    );

    if (!user) {
      return response
        .status(404)
        .json({ error: true, message: "User does not exist" });
    }

    // Check if oldPassword, newPassword, confirmPassword is missing
    if (!oldPassword || !newPassword || !confirmPassword) {
      return response.status(400).json({
        error: "Please fill in all the fields",
      });
    }

    // Check if oldPassword is correct
    const oldPasswordHash = authentication(
      user.authentication.salt,
      oldPassword
    );
    if (oldPasswordHash !== user.authentication.password) {
      return response.status(403).json({ error: "Your password is incorrect" });
    }

    // Check if newPassword is same as oldPassword
    const newPasswordHash = authentication(
      user.authentication.salt,
      newPassword
    );
    if (newPasswordHash === user.authentication.password) {
      return response.status(400).json({
        error: "New password cannot be same as old password",
      });
    }

    const validationError = validatePassword(newPassword, confirmPassword);

    if (validationError) {
      return response.status(400).json(validationError);
    }

    // Update password
    const newSalt = random();
    user.authentication.salt = newSalt;

    user.authentication.password = authentication(newSalt, newPassword);
    await user.save();
    return response.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("Error in updatePassword", error);
    return response.sendStatus(500).json({ error: `Error: ${error}` });
  }
};
