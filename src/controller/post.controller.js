import { v2 as cloudinary } from "cloudinary";
import { User } from "../db/user.model.js";
import Post from "../db/post.model.js";
import Notification from "../db/notification.model.js";
import View from "../db/view.model.js";

export const createPost = async (request, response) => {
  const { text } = request.body;
  let { images } = request.body;
  const userID = request.identify._id.toString();

  try {
    // console.log(text);
    // console.log(images);

    // Check if the post has text or images
    if (!text && !images) {
      return response
        .status(400)
        .json({ error: "Plese provide text or image in the post" });
    }

    // Upload images to cloudinary (max 4 images)
    if (images && images.length > 4) {
      return response
        .status(400)
        .json({ error: "You can upload maximum 4 images" });
    } else if (images && images.length > 0) {
      // Upload images to cloudinary and get the image URLs form secure_url
      const imageSecureURLs = [];
      for (let i = 0; i < images.length; i++) {
        const uploadResponse = await cloudinary.uploader.upload(images[i], {
          folder: "PostImage",
        });
        imageSecureURLs.push(uploadResponse.secure_url);
      }
      images = imageSecureURLs;
    }

    // Create a post
    const post = await Post.create({
      author: userID,
      text,
      images,
    });

    await post.save();
    return response.status(201).json(post);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const createReplyPost = async (request, response) => {
  const { id: parentPostID } = request.params;
  const { text } = request.body;
  let { images } = request.body;
  const userID = request.identify._id.toString();

  try {
    // Check if the post has text or images
    if (!text && !images) {
      return response
        .status(400)
        .json({ error: "Plese provide text or image in the reply post" });
    }

    // Upload images to cloudinary (max 4 images)
    if (images && images.length > 4) {
      return response
        .status(400)
        .json({ error: "You can upload maximum 4 images" });
    } else if (images && images.length > 0) {
      // Upload images to cloudinary and get the image URLs form secure_url
      const imageSecureURLs = [];
      for (let i = 0; i < images.length; i++) {
        const uploadResponse = await cloudinary.uploader.upload(images[i], {
          folder: "PostImage",
        });
        imageSecureURLs.push(uploadResponse.secure_url);
      }
      images = imageSecureURLs;
    }

    // Check parentpost author
    const parentPost = await Post.findById(parentPostID);

    // Create a replyPost
    const replyPost = await Post.create({
      author: userID,
      text,
      images,
      parentPostID: parentPostID,
    });
    await replyPost.save();

    // check if the post author is the same as current user
    if (parentPost.author.toString() === userID) {
      return response.status(201).json(replyPost);
    }

    // check if the author has blocked the notification
    if (!request.blockedNotification) {
      // Create a new notification
      await Notification.create({
        from: userID,
        to: parentPost.author,
        type: "reply",
        post: parentPostID,
      });
    }

    return response.status(201).json(replyPost);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
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
    const feedPosts = await Post.find({
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
    if (!feedPosts) {
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
      feedPosts,
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
      } else if (!request.blockedNotification) {
        await Notification.create({
          from: userID,
          to: post.author,
          type: "share",
          post: postID,
        });
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
