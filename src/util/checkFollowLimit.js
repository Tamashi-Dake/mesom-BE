const checkFollowLimit = (verified, type, length) => {
  // Set limit based on whether the user is verified or not
  const limit = verified ? 5000 : 1000;

  if (length >= limit) {
    const message = user.verified
      ? type === "following"
        ? "You have reached the maximum following limit of 5000."
        : "This user has reached the maximum followers limit of 5000."
      : type === "following"
      ? "You have reached the maximum following limit, please upgrade to a verified account."
      : "This user has reached the maximum followers limit.";

    return { message: message };
  }
  return null;
};

export default checkFollowLimit;
