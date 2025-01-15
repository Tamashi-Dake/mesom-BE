import { v2 as cloudinary } from "cloudinary";

import {
  deleteUserById,
  getUserById,
  getUserByUsername,
  User,
} from "../db/user.model.js";
import Notification from "../db/notification.model.js";

import { authentication, random } from "../util/authenticationCrypto.js";
import streamUpload from "../util/streamUpload.js";

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

export const getUserFromUsername = async (request, response) => {
  try {
    const user = await getUserByUsername(request.params.username);
    return response.status(200).json(user);
  } catch (error) {
    console.log("error in getUserFromUsername", error);
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

// TODO: Allow update username ONCE
// get update info from request body
// if (!username) {
//   return response.status(400).json({
//     error: true,
//     message: "Username is required",
//   });
// }

// user.username = username;
//  username,
export const updateUser = async (request, response) => {
  const { id } = request.params;
  const { displayName, bio, location, website } = request.body;
  const files = request.files;
  try {
    const user = await getUserById(id);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    // user.profile.dob = profile.dob || user.profile.dob;
    user.displayName = displayName || user.displayName;
    user.profile.bio = bio || user.profile.bio;
    user.profile.location = location || user.profile.location;
    user.profile.website = website || user.profile.website;

    if (files.avatarImg && files.avatarImg.length > 0) {
      if (user.profile.avatarImg) {
        // console.log(user.profile.avatarImg.split("/").pop().split(".")[0]);
        await cloudinary.uploader.destroy(
          `Mesom/AvatarImage/${
            user.profile.avatarImg.split("/").pop().split(".")[0]
          }`
        );
      }
      const avatarResult = await streamUpload(
        files.avatarImg[0].buffer,
        "Mesom/AvatarImage"
      );
      user.profile.avatarImg = avatarResult.secure_url;
    }

    // const uploadResponse = await cloudinary.uploader.upload(
    //   files.avatarImg[0].buffer,
    //   {
    //     folder: "Mesom/AvatarImage",
    //   }
    // );
    // user.profile.avatarImg = uploadResponse.secure_url;
    // }

    if (files.coverImg && files.coverImg.length > 0) {
      if (user.profile.coverImg) {
        await cloudinary.uploader.destroy(
          `Mesom/CoverImage/${
            user.profile.coverImg.split("/").pop().split(".")[0]
          }`
        );
      }

      const coverResult = await streamUpload(
        files.coverImg[0].buffer,
        "Mesom/CoverImage"
      );
      user.profile.coverImg = coverResult.secure_url;

      // const uploadResponse = await cloudinary.uploader.upload(
      //   files.coverImg[0].buffer,
      //   {
      //     folder: "Mesom/CoverImage",
      //   }
      // );
      // user.profile.coverImg = uploadResponse.secure_url;
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
      // console.log(
      //   "oldPassword, newPassword, confirmPassword is missing",
      //   oldPassword,
      //   newPassword,
      //   confirmPassword
      // );
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
  const { id: targetUserId } = request.params;
  const currentUserId = request.identify._id.toString();
  try {
    // get current user and target user
    const currentUser = await getUserById(currentUserId);
    const targetUser = await getUserById(targetUserId);

    // Check if user is trying to follow themselves
    if (currentUserId === targetUserId) {
      return response.status(400).json({ error: "You cannot follow yourself" });
    }

    // Check if user is already following
    const isFollowing = currentUser.following.includes(targetUser._id);

    // check if notification already exists
    const followNotification = await Notification.findOne({
      type: "follow",
      from: currentUser._id,
      to: targetUser._id,
    });

    // TODO: Add
    // following limit (e.g. 1000 for free users, 5000 for verified users)
    // followers limit (e.g. 1000 for free users, 5000 for verified users)

    // check following limit for current user
    if (
      currentUser.following.length >= 1000 &&
      currentUser.verified === false
    ) {
      return response.status(400).json({
        error:
          "You have reached the maximum following limit, please upgrade to a verified account",
      });
    }

    // check followers limit for target user
    if (targetUser.followers.length >= 1000 && targetUser.verified === false) {
      return response.status(400).json({
        error:
          "This user has reached the maximum followers limit, please ask them to upgrade to a verified account",
      });
    }

    // Follow or unfollow user
    if (!isFollowing) {
      // Add user to following list
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      if (followNotification) {
        await Notification.updateOne(
          { _id: followNotification._id },
          { show: true }
        );
      } else if (!request.blockedNotification) {
        await Notification.create({
          from: currentUserId,
          to: targetUserId,
          type: "follow",
        });
      }
    } else {
      // Remove user from following list
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(currentUser._id);

      if (followNotification) {
        await Notification.updateOne(
          { _id: followNotification._id },
          { show: false }
        );
      }
    }

    // Save changes to both users
    await currentUser.save();
    await targetUser.save();

    const updatedFollowers = targetUser.followers;

    return response.status(200).json({
      message: !isFollowing
        ? `${targetUser.username} followed successfully`
        : `${targetUser.username} unfollowed successfully`,
      followers: updatedFollowers,
    });
  } catch (error) {
    console.log("Error when follow user", error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getSuggestedUsers = async (request, response) => {
  const userId = request.identify._id;
  try {
    // // Lấy danh sách người dùng mà người dùng hiện tại đang theo dõi
    const userFollowedByCurrentUser = await getUserById(userId)
      .select("following")
      .lean();
    // const following = userFollowedByCurrentUser.following;

    // // Lấy danh sách user mà bạn của currentUser đang theo dõi nhưng currentUser không theo dõi
    // // TODO: What is this?
    // const friendOfFriends = await User.find({
    //   _id: { $nin: following.concat(userId) },
    //   following: { $in: following },
    // })
    //   .limit(5);

    // Lấy danh sách người dùng, loại trừ người dùng hiện tại và những người đã theo dõi
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: userFollowedByCurrentUser.following },
        },
      },
      {
        $project: {
          "authentication.password": 0,
          "authentication.salt": 0,
          "authentication.sessionToken": 0,
        },
      },
      { $sample: { size: 10 } },
    ]);

    const admin = await User.findOne()
      .sort({ createdAt: 1 })
      .select(
        "-authentication.password -authentication.salt -authentication.sessionToken"
      );

    // Lọc ra 2 người dùng ngẫu nhiên từ danh sách đã lấy
    const suggestedUsers = users
      .filter((user) => user._id.toString() !== admin._id.toString()) // Loại bỏ admin nếu có
      .slice(0, 2);

    response.status(200).json({ admin, suggestedUsers });
  } catch (error) {
    console.log("Error fetching suggested users", error);
    return response.status(500).json({ error: `Error: ${error}` });
  }
};
