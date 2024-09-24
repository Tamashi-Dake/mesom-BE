import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

import { User } from "../db/user.model.js";
import Post from "../db/post.model.js";
import Notification from "../db/notification.model.js";
import View from "../db/view.model.js";

// TODO: refactor interaction functions to return updated value
// => react-query don't have to refetch all data

export const createPost = async (req, res) => {
  const {
    text,
    // , images = []
  } = req.body;
  const files = req.files;
  const userID = req.identify._id.toString();

  try {
    // Kiểm tra xem bài đăng có văn bản hoặc hình ảnh không
    if (!text && files.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide text or image in the post" });
    }

    // Kiểm tra số lượng hình ảnh
    if (files.length > 4) {
      return res
        .status(400)
        .json({ error: "You can upload a maximum of 4 images" });
    }

    // Tải lên hình ảnh nếu có
    // const imageSecureURLs =
    //   images.length > 0
    //     ? await Promise.all(
    //         images.map((image) =>
    //           cloudinary.uploader
    //             .upload(image, { folder: "PostImage" })
    //             .then((uploadResponse) => uploadResponse.secure_url)
    //         )
    //       )
    //     : [];
    const imageSecureURLs =
      files.length > 0
        ? await Promise.all(
            files.map(
              (file) =>
                new Promise((resolve, reject) => {
                  const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "Mesom/PostImage" },
                    (error, result) => {
                      if (error) return reject(error);
                      resolve(result.secure_url);
                    }
                  );
                  streamifier.createReadStream(file.buffer).pipe(uploadStream);
                })
            )
          )
        : [];

    // Tạo bài đăng
    const post = await Post.create({
      author: userID,
      text,
      images: imageSecureURLs,
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `Lỗi: ${error.message || error}` });
  }
};

// TODO: Làm như trên
export const createReplyPost = async (req, res) => {
  const { id: parentPostID } = req.params;
  const { text, images = [] } = req.body;
  const userID = req.identify._id.toString();

  try {
    // Kiểm tra xem bài đăng có văn bản hoặc hình ảnh không
    if (!text && images.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide text or image in the reply post" });
    }

    // Kiểm tra số lượng hình ảnh
    if (images.length > 4) {
      return res
        .status(400)
        .json({ error: "You can upload a maximum of 4 images" });
    }

    // Tải lên hình ảnh nếu có
    const imageSecureURLs =
      images.length > 0
        ? await Promise.all(
            images.map((image) =>
              cloudinary.uploader
                .upload(image, { folder: "PostImage" })
                .then((uploadResponse) => uploadResponse.secure_url)
            )
          )
        : [];

    // Kiểm tra bài đăng gốc
    const parentPost = await Post.findById(parentPostID);
    if (!parentPost) {
      return res.status(404).json({ error: "Parent post doesn't exist" });
    }

    // Tạo bài trả lời
    const replyPost = await Post.create({
      author: userID,
      text,
      images: imageSecureURLs,
      parentPostID,
    });

    // TODO: Cập nhật số lượng phản hồi trong bài đăng gốc
    await Post.updateOne({ _id: parentPostID }, { $inc: { userReplies: 1 } });

    // Kiểm tra xem người dùng có phải là tác giả của bài gốc không
    if (parentPost.author.toString() === userID) {
      return res.status(201).json(replyPost);
    }

    // Kiểm tra xem người dùng có chặn thông báo không
    if (!req.blockedNotification) {
      // Tạo thông báo mới
      await Notification.create({
        from: userID,
        to: parentPost.author,
        type: "reply",
        post: parentPostID,
      });
    }

    return res.status(201).json(replyPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `Lỗi: ${error.message || error}` });
  }
};

export const getAllPosts = async (request, response) => {
  // set the limit of posts per request
  const { limit = 30, skip = 0 } = request.query;
  try {
    // get all posts
    const posts = await Post.find({ parentPostID: { $exists: false } })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select: " displayName username profile.avatar",
      });

    // get total number of posts
    const totalPosts = await Post.countDocuments({
      parentPostID: { $exists: false },
    });

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      numberOfPostsFetched: Math.min(
        parseInt(skip) + parseInt(limit),
        totalPosts
      ),
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getPostsByFollowing = async (request, response) => {
  const userId = request.identify._id.toString();
  const { limit = 30, skip = 0 } = request.body;
  try {
    // get user
    const user = await User.findById(userId);
    // get following of user
    const following = user.following;

    // get posts from user in following
    const posts = await Post.find({
      author: { $in: following },
      parentPostID: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate({
        path: "author",
        select: " displayName username profile.avatar",
      });
    if (!posts) {
      return response
        .status(404)
        .json({ message: "You aren't following anyone" });
    }

    // get total number of posts
    const totalPosts = await Post.countDocuments({
      author: { $in: following },
      parentPostID: { $exists: false },
    });

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      numberOfPostsFetched: Math.min(
        parseInt(skip) + parseInt(limit),
        totalPosts
      ),
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error at ${error}` });
  }
};

export const getPostsByUser = async (request, response) => {
  const userId = request.params.id;
  const { limit = 30, skip = 0 } = request.query;
  try {
    // count all posts by the user
    const totalPosts = await Post.countDocuments({
      parentPostID: { $exists: false },
      author: userId,
    });

    // get all posts by the user and posts with userShared contains the userID
    const posts = await Post.find({
      $or: [
        { parentPostID: { $exists: false }, author: userId },
        { parentPostID: { $exists: false }, userShared: userId },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select: "displayName username profile.avatar",
      });
    if (!posts) {
      return response.status(404).json({ message: "No posts found" });
    }

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      numberOfPostsFetched: Math.min(
        parseInt(skip) + parseInt(limit),
        totalPosts
      ),
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getLikedPostsByUser = async (request, response) => {
  const { userId } = request.params;
  const { limit = 30, skip = 0 } = request.query;
  try {
    // check if the user exists
    const user = await User.findById(userId);
    if (!user) return response.status(404).json({ error: "User not found" });

    // count all liked posts
    const totalLikedPosts = await Post.countDocuments({ userLikes: userId });

    // get all liked posts contains the userID
    const posts = await Post.find({ userLikes: userId })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select: " displayName username profile.avatar",
      });
    if (!posts) {
      return response
        .status(404)
        .json({ message: "You haven't liked any post" });
    }

    return response.status(200).json({
      posts,
      totalLikedPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      numberOfPostsFetched: Math.min(
        parseInt(skip) + parseInt(limit),
        totalLikedPosts
      ),
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getPost = async (request, response) => {
  const { id } = request.params;

  try {
    const post = await Post.findById(id);
    return response.status(200).json(post);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getRepliesForPost = async (request, response) => {
  const { id: parentPostID } = request.params;
  const { limit = 30, skip = 0 } = request.query;
  try {
    // count all replies for the post
    const totalReplies = await Post.countDocuments({ parentPostID });

    // get all replies for the post
    const replies = await Post.find({ parentPostID })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select: "displayName username profile.avatar",
      });
    if (!replies) {
      response.status(404).json({ message: "No replies found" });
    }

    return response.status(200).json({
      replies,
      totalReplies,
      limit: parseInt(limit),
      skip: parseInt(skip),
      numberOfRepliesFetched:
        totalReplies > limit + parseInt(skip)
          ? parseInt(skip) + limit
          : totalReplies,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const updatePost = async (request, response) => {
  try {
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const deletePost = async (request, response) => {
  const { id: postID } = request.params;
  const userID = request.identify._id.toString();

  try {
    // Check if the post exists
    const post = await Post.findById(postID);

    // Check if the user is the author of the post
    if (post.author.toString() !== userID) {
      return response
        .status(401)
        .json({ error: "You are not authorized to delete this post" });
    }

    // check if the post has images
    if (post.images && post.images.length > 0) {
      // Delete images from cloudinary
      for (let i = 0; i < post.images.length; i++) {
        const publicImageID = post.images[i].split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`Mesom/PostImage/${publicImageID}`);
      }
    }

    // Delete the post
    await post.deleteOne();
    return response.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const toggleLikePost = async (request, response) => {
  const { id: postID } = request.params;
  const userID = request.identify._id.toString();
  try {
    // Check if the post exists
    const post = await Post.findById(postID);

    // Check if the user has already liked the post
    const isLiked = post.userLikes.includes(userID);

    // check if notification already exists
    const likeNotification = await Notification.findOne({
      from: userID,
      to: post.author,
      type: "like",
      post: postID,
    });

    if (!isLiked) {
      post.userLikes.push(userID);
      await post.save();
      response.status(200).json({ message: `Post liked` });

      // Check if the post author is the same as the user
      if (post.author.toString() === userID) {
        return;
      }

      // check if notification already exists or the author has blocked the notification type or post
      if (likeNotification) {
        // Show the notification if the post is liked
        await Notification.updateOne(
          { _id: likeNotification._id },
          { show: true }
        );
      } else if (!request.blockedNotification) {
        // Create a new notification
        await Notification.create({
          from: userID,
          to: post.author,
          type: "like",
          post: postID,
        });
      }
    } else {
      await Post.updateOne({ _id: postID }, { $pull: { userLikes: userID } });
      response.status(200).json({ message: `Post unliked` });

      if (likeNotification) {
        // Hide the notification if the post is unliked
        await Notification.updateOne(
          { _id: likeNotification._id },
          { show: false }
        );
      }
    }
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const toggleSharePost = async (request, response) => {
  const { id: postID } = request.params;
  const userID = request.identify._id.toString();
  try {
    // Check if the  post exists
    const post = await Post.findById(postID);

    // Check if the user has already shared the post
    const isShared = post.userShared.includes(userID);
    // check if notification already exists
    const shareNotification = await Notification.findOne({
      from: userID,
      to: post.author,
      type: "share",
      post: postID,
    });

    if (!isShared) {
      post.userShared.push(userID);
      await post.save();
      response.status(200).json({ message: `Post shared` });

      // Check if the post author is the same as the user
      if (post.author.toString() === userID) {
        return;
      }

      // check if notification already exists or the author has blocked the notification type or post
      if (shareNotification) {
        await Notification.updateOne(
          { _id: shareNotification._id },
          { show: true }
        );
      } else {
        if (request.blockedNotification) {
          console.log("User currently blocking notification.");
        } else {
          await Notification.create({
            from: userID,
            to: post.author,
            type: "share",
            post: postID,
          });
        }
      }
    } else {
      await Post.updateOne({ _id: postID }, { $pull: { userShared: userID } });
      response.status(200).json({ message: `Post unshared` });
      if (shareNotification) {
        await Notification.updateOne(
          { _id: shareNotification._id },
          { show: false }
        );
      }
    }
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const increasePostView = async (request, response) => {
  const { id: postID } = request.params;
  const userID = request.identify._id.toString();
  try {
    // Check if View exists (find by postID and userID)
    const view = await View.findOne({ postID, userID });
    if (!view) {
      // Create a view
      await View.create({ postID, userID });
      // Increase the post view
      await Post.updateOne({ _id: postID }, { $inc: { views: 1 } });

      return response.status(200).json({ message: `Post view increased` });
    } else {
      return response.status(400).json({ error: `You just viewed this post` });
    }
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};
