import { Server } from "socket.io";
import { joinConversationHandler } from "./handler/conversation.handler.js";

const setupSocket = (server) => {
  const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.PROD_URL
          : process.env.DEV_FRONTEND_URL,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 New socket connected:", socket.id);

    // Đăng ký từng nhóm handler riêng
    joinConversationHandler(socket);

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.id);
    });
  });
};

export default setupSocket;
