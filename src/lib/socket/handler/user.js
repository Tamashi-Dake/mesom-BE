export const userJoinHandler = (socket, io) => {
  socket.on("user:join", (userId) => {
    console.log(`User ${userId} is join`);
  });
};
