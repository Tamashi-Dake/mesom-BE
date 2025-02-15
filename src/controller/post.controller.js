import { v2 as cloudinary } from "cloudinary";

import { User } from "../db/user.model.js";
import Post from "../db/post.model.js";
import Notification from "../db/notification.model.js";
import View from "../db/view.model.js";
import { randomDelay } from "../util/delay.js";
import validatePostData from "../util/validatePostData.js";
import uploadImagesToCloudinary from "../util/uploadImagesToCloudinary.js";

export const createPost = async (req, res) => {
  const { text } = req.body;
  const files = req.files;
  const userID = req.identify._id.toString();

  try {
    if (!text && files.length === 0) {
      return res
        .status(400)
        .json({ error: "Please provide text or image in the post" });
    }
    // Kiểm tra dữ liệu đầu vào
    const validationError = validatePostData(text, files);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    // Tải ảnh lên Cloudinary
    const imageSecureURLs = await uploadImagesToCloudinary(
      files,
      "Mesom/PostImage"
    );

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

export const createReplyPost = async (req, res) => {
  const { id: parentPostID } = req.params;
  const { text, authorName } = req.body;
  const files = req.files;
  const userID = req.identify._id.toString();
  try {
    // Kiểm tra dữ liệu đầu vào
    const validationError = validatePostData(text, files);
    if (validationError) {
      return res.status(400).json(validationError);
    }
    const parentPost = await Post.findById(parentPostID);

    // Tải ảnh lên Cloudinary
    const imageSecureURLs = await uploadImagesToCloudinary(
      files,
      "Mesom/PostImage"
    );

    // Tạo bài trả lời
    const replyPost = await Post.create({
      author: userID,
      text,
      images: imageSecureURLs,
      parent: {
        parentPostID: parentPostID,
        authorName: authorName,
      },
    });

    const updatedPost = await Post.findOneAndUpdate(
      { _id: parentPostID },
      { $inc: { userReplies: 1 } },
      { new: true } // Trả về document đã được cập nhật
    );

    // Nếu không phải tác giả của bài gốc và người dùng không chặn thông báo
    if (parentPost.author.toString() !== userID && !req.blockedNotification) {
      // Tạo thông báo mới
      await Notification.create({
        from: userID,
        to: parentPost.author,
        type: "reply",
        post: replyPost._id,
      });
    }

    return res.status(201).json({
      replyPost,
      numberReplies: updatedPost.userReplies,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json("Can't create reply post");
  }
};

export const getAllPosts = async (request, response) => {
  // set the limit of posts per request
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // get all posts without parent
    const posts = await Post.find({
      parent: { $exists: false },
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select:
          "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });

    // get total number of posts
    const totalPosts = await Post.countDocuments({
      parent: { $exists: false },
      deleted: false,
    });
    const remainingPosts = totalPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getPostsByFollowing = async (request, response) => {
  const userId = request.identify._id.toString();
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // get user
    const user = await User.findById(userId);
    // get following of user
    const following = user.following;

    // get total number of posts
    const totalPosts = await Post.countDocuments({
      author: { $in: following },
      parent: { $exists: false },
      deleted: false,
    });
    if (totalPosts === 0)
      return response
        .status(202)
        .json({ message: "No posts from people you follow yet." });

    // get posts from user in following
    const posts = await Post.find({
      author: { $in: following },
      parent: { $exists: false },
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate({
        path: "author",
        select:
          "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });
    if (!posts) {
      return response
        .status(404)
        .json({ message: "You aren't following anyone" });
    }

    const remainingPosts = totalPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error at ${error}` });
  }
};

export const getPostsByUser = async (request, response) => {
  const userId = request.params.id;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // count all posts by the user
    const totalPosts = await Post.countDocuments({
      $or: [
        { parent: { $exists: false }, author: userId },
        { parent: { $exists: false }, userShared: userId },
      ],
      deleted: false,
    });
    if (totalPosts === 0)
      return response
        .status(202)
        .json({ message: "This user hasn't posted yet" });

    // get all posts by the user and posts with userShared contains the userID
    const posts = await Post.find({
      $or: [
        { parent: { $exists: false }, author: userId },
        { parent: { $exists: false }, userShared: userId },
      ],
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select:
          "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });
    if (!posts) {
      return response.status(404).json({ message: "No posts found" });
    }

    const remainingPosts = totalPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getRepliesByUser = async (request, response) => {
  const userId = request.params.id;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    const totalPosts = await Post.countDocuments({
      parent: { $exists: true },
      author: userId,
      deleted: false,
    });
    if (totalPosts === 0)
      return response
        .status(202)
        .json({ message: "This user hasn't replied yet" });

    const posts = await Post.find({
      parent: { $exists: true },
      author: userId,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select:
          "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });
    if (!posts) {
      return response.status(404).json({ message: "No posts found" });
    }

    const remainingPosts = totalPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getMediasByUser = async (request, response) => {
  const userId = request.params.id;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    const totalPosts = await Post.countDocuments({
      parent: { $exists: false },
      author: userId,
      deleted: false,
      images: { $ne: [] },
    });
    if (totalPosts === 0)
      return response
        .status(202)
        .json({ message: "This user hasn't posted any photos yet" });

    const posts = await Post.find({
      parent: { $exists: false },
      author: userId,
      deleted: false,
      images: { $ne: [] },
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select:
          "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });
    if (!posts) {
      return response.status(404).json({ message: "No posts found" });
    }

    const remainingPosts = totalPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts,
      totalPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getLikedPostsByUser = async (request, response) => {
  const userId = request.params.id;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip);
  try {
    // check if the user exists
    const user = await User.findById(userId);

    // count all liked posts
    const totalLikedPosts = await Post.countDocuments({
      userLikes: userId,
      deleted: false,
    });
    if (totalLikedPosts === 0)
      return response
        .status(202)
        .json({ message: "This user hasn't liked any posts yet" });

    // get all liked posts contains the userID
    const posts = await Post.find({ userLikes: userId, deleted: false })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select:
          " displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });
    if (!posts) {
      return response
        .status(404)
        .json({ message: `@${user.username} haven't liked any post` });
    }

    const remainingPosts = totalLikedPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts,
      totalLikedPosts,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getUserBookmarks = async (request, response) => {
  const userId = request.identify._id.toString();
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip) || 0;
  try {
    const user = await User.findById(userId);
    const bookmarks = user.bookmarks;
    const totalPosts = bookmarks.length;
    if (totalPosts === 0) {
      return response
        .status(200)
        .json({ message: "You don't have any bookmarks" });
    }

    // Lọc và cập nhật bookmark: loại bỏ các bookmark với post đã bị xóa
    const validBookmarks = [];
    const invalidPostIds = [];

    for (const bookmark of bookmarks) {
      const post = await Post.findById(bookmark.post).select("id deleted"); // Tìm post tương ứng với bookmark
      if (post && !post.deleted) {
        validBookmarks.push(bookmark);
      } else {
        invalidPostIds.push(bookmark.post); // Lưu lại các post đã bị xóa hoặc không tồn tại
      }
    }

    // Cập nhật lại mảng bookmarks của người dùng: xóa các post không hợp lệ
    if (invalidPostIds.length > 0) {
      await User.updateOne(
        { _id: userId },
        { $pull: { bookmarks: { post: { $in: invalidPostIds } } } }
      );
    }

    const totalValidPosts = validBookmarks.length;

    if (totalValidPosts === 0) {
      return response
        .status(200)
        .json({ message: "All your bookmarks have been deleted or invalid" });
    }

    // Sắp xếp lại các bookmarks hợp lệ theo thời gian bookmarked
    const sortedBookmarks = validBookmarks
      .sort((a, b) => b.bookmarkedAt - a.bookmarkedAt)
      .slice(skip, skip + limit);
    const postIds = sortedBookmarks.map((bookmark) => bookmark.post);
    const posts = await Post.find({
      _id: { $in: postIds },
      deleted: false,
    }).populate({
      path: "author",
      select:
        "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
    });

    // Bảo toàn thứ tự
    const sortedPosts = postIds.map((id) =>
      posts.find((post) => post._id.toString() === id.toString())
    );

    const remainingPosts = totalPosts - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts: sortedPosts,
      totalPosts,
      limit: limit,
      skip: skip,
      nextSkip: nextSkip,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error at ${error}` });
  }
};

export const getPost = async (request, response) => {
  const { id } = request.params;

  try {
    const post = await Post.findById(id).populate({
      path: "author",
      select:
        " displayName username profile.avatarImg profile.coverImg profile.bio following followers",
    });
    if (post.deleted) {
      return response.status(200).json({
        _id: post._id,
        deleted: true,
        author: {
          username: post.author.username,
        },
      });
    }
    return response.status(200).json(post);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const getRepliesForPost = async (request, response) => {
  const { id: parentPostID } = request.params;
  const limit = parseInt(request.query.limit) || 10;
  const skip = parseInt(request.query.skip) || 0;
  try {
    // count all replies for the post
    const totalReplies = await Post.countDocuments({
      "parent.parentPostID": parentPostID,
      deleted: false,
    });
    if (totalReplies === 0)
      return response
        .status(202)
        .json({ message: "This post has no replies yet" });

    // get all replies for the post
    const replies = await Post.find({
      "parent.parentPostID": parentPostID,
      deleted: false,
    })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .populate({
        path: "author",
        select:
          "displayName username profile.avatarImg profile.coverImg profile.bio following followers",
      });
    if (!replies) {
      response.status(404).json({ message: "No replies found" });
    }

    const remainingPosts = totalReplies - skip - limit;
    const nextSkip = remainingPosts > 0 ? skip + limit : null;

    return response.status(200).json({
      posts: replies,
      totalReplies,
      limit: parseInt(limit),
      skip: parseInt(skip),
      nextSkip: nextSkip,
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

    // Update the post as deleted and clear the images
    await Post.updateOne(
      { _id: postID },
      { $set: { deleted: true, images: [] } }
    );

    // If the post is a reply, update the parent post's reply count
    if (post.parent.parentPostID) {
      const updatedPost = await Post.findOneAndUpdate(
        { _id: post.parent.parentPostID },
        { $inc: { userReplies: -1 } },
        { new: true } // Trả về document đã được cập nhật
      );

      return response.status(200).json({
        message: "Reply deleted successfully",
        numberReplies: updatedPost.userReplies,
      });
    }
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

      // Chỉ gửi thông báo nếu post.author không phải là người dùng hiện tại
      if (post.author.toString() !== userID) {
        if (likeNotification) {
          // Hiện thông báo nếu đã tồn tại và bài viết được like
          await Notification.updateOne(
            { _id: likeNotification._id },
            { show: true }
          );
        } else if (!request.blockedNotification) {
          // Tạo thông báo mới
          await Notification.create({
            from: userID,
            to: post.author,
            type: "like",
            post: postID,
          });
        }
      }
    } else {
      post.userLikes.pull(userID);

      // Ẩn thông báo nếu bài viết bị bỏ like
      if (likeNotification) {
        await Notification.updateOne(
          { _id: likeNotification._id },
          { show: false }
        );
      }
    }

    // Luôn lưu post bất kể có gửi thông báo hay không
    await post.save();

    const updatedLikes = post.userLikes;

    return response.status(200).json({
      message: !isLiked ? `Post liked` : `Post unliked`,
      likes: updatedLikes,
    });
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

    // Kiểm tra xem bài viết đã được chia sẻ hay chưa
    if (!isShared) {
      post.userShared.push(userID);

      // Chỉ gửi thông báo nếu tác giả không phải là người dùng hiện tại
      if (post.author.toString() !== userID) {
        if (shareNotification) {
          // Hiện thông báo nếu đã tồn tại và bài viết được chia sẻ
          await Notification.updateOne(
            { _id: shareNotification._id },
            { show: true }
          );
        } else if (!request.blockedNotification) {
          // Tạo thông báo mới
          await Notification.create({
            from: userID,
            to: post.author,
            type: "share",
            post: postID,
          });
        }
      }
    } else {
      post.userShared.pull(userID);

      // Ẩn thông báo nếu bài viết bị bỏ chia sẻ
      if (shareNotification) {
        await Notification.updateOne(
          { _id: shareNotification._id },
          { show: false }
        );
      }
    }

    // Luôn lưu bài viết bất kể có gửi thông báo hay không
    await post.save();

    // TODO: change userShared -> userShares
    const updatedShares = post.userShared;

    return response.status(200).json({
      message: !isShared ? `Post shared` : `Post unshared`,
      shares: updatedShares,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const toggleBookmarkPost = async (request, response) => {
  const { id: postID } = request.params;
  const userID = request.identify._id.toString();
  try {
    // Check if the user / post exists
    const user = await User.findById(userID);
    // // Kiểm tra xem bài viết đã được chia sẻ hay chưa
    // !isBookmarked ? user.bookmarks.push(postID) : user.bookmarks.pull(postID);
    // await user.save();

    // // Cập nhật userBookmarks trên bài viết và thông tin bookmarks của user
    // const updatedPost = await Post.findOneAndUpdate(
    //   { _id: postID },
    //   { $inc: { userBookmarks: bookmarkChange } },
    //   { new: true }
    // );

    // Kiểm tra xem bài viết đã được bookmark hay chưa
    const isBookmarked = user.bookmarks.some(
      (bookmark) => bookmark.post.toString() === postID.toString()
    );

    if (!isBookmarked) {
      user.bookmarks.push({
        post: postID,
        bookmarkedAt: new Date(),
      });
    } else {
      // Xóa bookmark, tìm đối tượng có post là postID và xóa
      user.bookmarks = user.bookmarks.filter(
        (bookmark) => bookmark.post.toString() !== postID.toString()
      );
    }

    await user.save();

    // Cập nhật số lượng bookmarks trên bài viết
    const bookmarkChange = isBookmarked ? -1 : 1;
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postID },
      { $inc: { userBookmarks: bookmarkChange } },
      { new: true }
    );

    // Lấy giá trị userBookmarks từ updatedPost
    const updatedBookmark = updatedPost.userBookmarks;

    // TODO: Add limit for Free user (100, 1000 for Premium)

    return response.status(200).json({
      message: !isBookmarked
        ? `Post has been bookmarked`
        : `Post has been removed from bookmarks`,
      userBookmarks: updatedBookmark,
    });
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};

export const increasePostView = async (request, response) => {
  const { id: postID } = request.params;
  const userID = request.identify._id.toString();
  try {
    //TODO: If increase view is okay in produciton then remove delay
    await randomDelay(500, 1500);
    // Check if View exists (find by postID and userID)
    const view = await View.findOne({ postID, userID });
    if (!view) {
      // Create a view
      await View.create({ postID, userID });
      // Increase the post view
      await Post.updateOne({ _id: postID }, { $inc: { views: 1 } });

      return response.status(200).json({ message: `Post view increased` });
    } else {
      return response.status(202).json({ error: `You just viewed this post` });
    }
  } catch (error) {
    console.log(error);
    return response.status(400).json({ error: `Error: ${error}` });
  }
};
