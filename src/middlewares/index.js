import get from "lodash/get.js";
import merge from "lodash/merge.js";
import { getUserBySessionToken } from "../db/user.model.js";

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
      return response.status(403).json({ error: true, message: "Forbidden" });
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
