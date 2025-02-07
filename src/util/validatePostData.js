const validatePostData = (text, files) => {
  if (!text && files.length === 0) {
    return { error: "Please provide text or image in the post" };
  }

  if (files.length > 4) {
    return { error: "You can upload a maximum of 4 images" };
  }

  return null;
};

export default validatePostData;
