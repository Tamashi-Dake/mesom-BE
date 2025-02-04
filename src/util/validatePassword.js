const validatePassword = (newPassword, confirmPassword) => {
  // Check if newPassword and confirmPassword match
  if (newPassword !== confirmPassword) {
    return {
      error: "Password and confirm password do not match",
    };
  }

  // Check if newPassword is valid
  if (newPassword.length < 6) {
    return {
      error: "Password must be at least 6 characters",
    };
  }

  const hasChars = /[a-zA-Z]/.test(newPassword);
  const hasNumbers = /\d/.test(newPassword);
  const hasNonalphas = /\W/.test(newPassword);

  if (!hasChars || !hasNumbers || !hasNonalphas) {
    return {
      error:
        "Password must contain at least one letter, one number, and one special character",
    };
  }

  return null; // Password is valid
};

export default validatePassword;
