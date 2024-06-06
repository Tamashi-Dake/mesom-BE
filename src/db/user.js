import mongoose from "mongoose";

// Schema
const UserSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
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
  profile: {
    dob: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
    },
    avatar: {
      type: String,
    },
    banner: {
      type: String,
    },
    bio: {
      type: String,
    },
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const UserModel = mongoose.model("User", UserSchema);

// Action
// Get

export const getUsers = async () => {
  return await UserModel.find();
};

export const getUserById = async (id) => {
  return await UserModel.findById(id);
};

export const getUserByUsername = async (username) => {
  return await UserModel.findOne({ username });
};

export const getUserBySessionToken = async (sessionToken) => {
  return await UserModel.findOne({
    "authentication.sessionToken": sessionToken,
  });
};

// Create

export const createUser = async (data) => {
  return new UserModel(data).save().then((user) => user.toObject());
};

// Delete
export const deleteUser = async (id) => {
  return await UserModel.findByIdAndDelete({ _id: id });
};

// Update
export const updateUser = async (id, data) => {
  return await UserModel.findByIdAndUpdate(id, data);
};
