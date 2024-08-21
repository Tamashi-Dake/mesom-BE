import get from "lodash/get.js";
import merge from "lodash/merge.js";
import { getUserBySessionToken } from "../db/user.model.js";
import Post from "../db/post.model.js";

export const isAuthenticated = async (request, response, next) => {
  try {
    // get session token from request cookies
    const sessionToken = request.cookies["mesom-auth"];

    // check if session token is missing
    if (!sessionToken) {
      return response
        .status(401)
        .json({ error: true, message: "Unauthorized" });
    }

    // get user by session token
    const user = await getUserBySessionToken(sessionToken);
    if (!user) {
      return response
        .status(400)
        .json({ error: true, message: "User does not exist" });
    }

    // merge user to request
    merge(request, { identify: user });
    // console.log(request.identify);

    // continue to next middleware
    return next();
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: true, message: `Error: ${error}` });
  }
};

// check if post is exist
export const checkPostStatus = async (request, response, next) => {
  try {
    // get post id from request params
    const { id } = request.params;

    // check if post id is missing
    if (!id) {
      return response
        .status(400)
        .json({ error: true, message: "Post ID is missing" });
    }

    // get post by id
    const post = await Post.findById(id);
    if (!post) {
      return response
        .status(400)
        .json({ error: true, message: "Post does not exist" });
    }

    // continue to next middleware
    return next();
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: true, message: `Error: ${error}` });
  }
};

// only work with User documents
export const isOwner = async (request, response, next) => {
  try {
    // get user id from request params
    const { id } = request.params;
    // get current user id from request
    const currentUserID = get(request, "identify._id");
    // console.log(request.identify);

    // check if current user is missing
    if (!currentUserID) {
      return response
        .status(401)
        .json({ error: true, message: "Unauthorized" });
    }

    // check if current user is not the owner of the resource
    if (currentUserID.toString() !== id) {
      return response
        .status(403)
        .json({ error: true, message: "You are not the owner!" });
    }

    // continue to next middleware
    return next();
  } catch (error) {
    console.log(error);
    return response
      .status(400)
      .json({ error: true, message: `Error: ${error}` });
  }
};
