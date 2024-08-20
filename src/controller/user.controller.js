import { v2 as cloudinary } from "cloudinary";

import {
  deleteUserById,
  getUserById,
  getUserByUsername,
  User,
} from "../db/user.model.js";
import Notification from "../db/notification.model.js";

import { authentication, random } from "../util/authenticationCrypto.js";

// export const getAllUsers = async (request, response) => {
//   try {
//     const users = await getUsers();
//     return response.status(200).json({
//       users,
//     });
//   } catch (error) {
//     console.log(error);
//     return response
//       .status(400)
//       .json({ error: true, message: `Error: ${error}` });
//   }
// };

export const getUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await getUserById(id);
    return response.status(200).json(user);
  } catch (error) {
    console.log("error in getUser", error);
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
  const { id } = request.params;
  let {
    //  username,
    displayName,
    profile,
  } = request.body;
  try {
    const user = await getUserById(id);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    // get update info from request body
    // if (!username) {
    //   return response.status(400).json({
    //     error: true,
    //     message: "Username is required",
    //   });
    // }

    // user.username = username;
    user.displayName = displayName;
    if (profile) {
      if (profile.dob) user.profile.dob = profile.dob;
      if (profile.location) user.profile.location = profile.location;
      if (profile.avatar) {
        const uploadResponse = await cloudinary.uploader.upload(
          profile.avatar,
          {
            folder: "AvatarImage",
          }
        );
        user.profile.avatar = uploadResponse.secure_url;
      }
      if (profile.banner) {
        const uploadResponse = await cloudinary.uploader.upload(
          profile.banner,
          {
            folder: "CoverImage",
          }
        );
        user.profile.banner = uploadResponse.secure_url;
      }
      if (profile.bio) user.profile.bio = profile.bio;
    }

    await user.save();
    return response
      .status(200)
      .json({ message: "User updated successfully", user });
  } catch (error) {
    console.log(error);
    return response.sendStatus(400);
  }
};

export const updatePassword = async (request, response) => {
  const { id } = request.params;
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
      console.log(
        "oldPassword, newPassword, confirmPassword is missing",
        oldPassword,
        newPassword,
        confirmPassword
      );
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

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        error: "New password and confirm password do not match",
      });
    }

    // Check if newPassword is valid
    // if (newPassword.length < 6) {
    //   return response.status(400).json({
    //     error: "Password must be at least 6 characters",
    //   });
    // }
    // const hasChars = /[a-zA-Z]/.test(newPassword);
    // const hasNumbers = /\d/.test(newPassword);
    // const hasNonalphas = /\W/.test(newPassword);
    // if (!hasChars || !hasNumbers || !hasNonalphas) {
    //   return response.status(400).json({
    //     error: "Password must contain at least one letter, one number, and one special character",
    //   })
    // }

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

export const toggleFollowUser = async (request, response) => {
  try {
    const { id } = request.params;
    const user = await getUserById(id);
    const currentUser = await getUserById(request.identify._id);

    // Check if user / currentUser is missing
    if (!user || !currentUser) {
      return response.status(400).json({ error: "User does not exist" });
    }

    // Check if user is trying to follow themselves
    if (currentUser._id.toString() === user._id.toString()) {
      return response.status(400).json({ error: "You cannot follow yourself" });
    }

    // Check if user is already following
    const isFollowing = currentUser.following.includes(user._id);

    // TODO: Add following limit (e.g. 100 for free users, 500 for verified users)
    // followers limit (e.g. 1000 for free users, 5000 for verified users)

    if (!isFollowing) {
      // Add user to following list
      currentUser.following.push(user._id);
      user.followers.push(currentUser._id);
      await currentUser.save();
      await user.save();

      // check if notification already exists
      const notification = await Notification.findOne({
        type: "follow",
        from: currentUser._id,
        to: user._id,
      });

      // check if user don't want to receive this type of notification
      // TODO: add notification settings (for type of notifications)

      if (!notification) {
        // send notification to user
        const newNotification = new Notification({
          type: "follow",
          from: currentUser._id,
          to: user._id,
        });
        await newNotification.save();
      }

      return response.status(200).json({
        message: `${user.username.toString()} followed successfully`,
      });
    } else {
      // Remove user from following list
      currentUser.following.pull(user._id);
      user.followers.pull(currentUser._id);
      await currentUser.save();
      await user.save();

      return response.status(200).json({
        message: `${user.username.toString()} unfollowed successfully`,
      });
    }
  } catch (error) {
    console.log("Error in toggleFollowUser", error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getSuggestedUsers = async (request, response) => {
  try {
    const userId = request.identify._id;

    // Lấy danh sách người dùng mà người dùng hiện tại đang theo dõi
    const userFollowedByCurrentUser = await getUserById(userId).select(
      "following"
    );
    const following = userFollowedByCurrentUser.following;

    // Lấy danh sách user mà bạn của currentUser đang theo dõi nhưng currentUser không theo dõi
    // TODO: What is this?
    const friendOfFriends = await User.find({
      _id: { $nin: following.concat(userId) },
      following: { $in: following },
    })
      .select("-authentication")
      .limit(5);

    res.status(200).json(friendOfFriends);
  } catch (error) {
    console.log("Error in getSuggestedUsers", error);
    return response.status(500).json({ error: `Error: ${error}` });
  }
};