import crypto from "crypto";

export const random = () => {
  return crypto.randomBytes(128).toString("base64");
};

export const authentication = (salt, password) => {
  return crypto
    .createHmac("sha256", [salt, password].join("/"))
    .update(process.env.SECRET_KEY)
    .digest("hex");
};
