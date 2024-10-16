import mongoose from "mongoose";

// Schema
const UserSchema = new mongoose.Schema(
  {
    displayName: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    authentication: {
      password: {
        type: String,
        required: true,
        select: false,
      },
      salt: {
        type: String,
        select: false,
      },
      sessionToken: {
        type: String,
        select: false,
      },
    },
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    profile: {
      dob: {
        type: Date,
      },
      location: {
        type: String,
      },
      avatarImg: {
        type: String,
        default: "",
      },
      coverImg: {
        type: String,
        default: "",
      },
      bio: {
        type: String,
        default: "",
      },
      website: {
        type: String,
      },
    },
    verified: {
      type: Boolean,
      default: false,
    },
    pinnedTweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);

// Action

// export const getUsers = () => {
//   return UserModel.find();
// };

export const getUserById = (id) => {
  return User.findById(id);
};

export const getUserByUsername = (username) => {
  return User.findOne({ username });
};

export const getUserBySessionToken = (sessionToken) => {
  return User.findOne({
    "authentication.sessionToken": sessionToken,
  });
};

// Create
export const createUser = (data) => {
  return new User(data).save();
};

// Delete
export const deleteUserById = (id) => {
  return User.findByIdAndDelete({ _id: id });
};

// Update
// export const updateUser = (id, data) => {
//   return User.findByIdAndUpdate(id, data);
// };
