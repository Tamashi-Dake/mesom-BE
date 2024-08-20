import { v2 as cloudinary } from "cloudinary";
import { User } from "../db/user.model.js";
import Post from "../db/post.model.js";

export const createPost = async (request, response) => {
  const { text } = request.body;
  let { images } = request.body;
  const userID = request.identify._id.toString();

  try {
    const user = await User.findById(userID);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

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

// export const getAllPosts = async (request, response) => {
//   try {

//   } catch (error) {
//     console.log(error);
//     return response.status(400).json({error: `Error: ${error}`});
//   }
// }

export const getPost = async (request, response) => {
  const { id } = request.params;

  try {
    const post = await Post.findById(id);
    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }
    return response.status(200).json(post);
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
  const { id } = request.params;
  const userID = request.identify._id.toString();

  try {
    const user = await User.findById(userID);
    if (!user) {
      return response.status(404).json({ error: "User not found" });
    }

    // Check if the post exists
    const post = await Post.findById(id);
    if (!post) {
      return response.status(404).json({ error: "Post not found" });
    }

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
