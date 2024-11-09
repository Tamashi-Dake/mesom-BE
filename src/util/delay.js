export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const randomDelay = (min, max) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};
