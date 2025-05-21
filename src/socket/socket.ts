import { Server } from "socket.io";
import { MessageData, PrivateMessage } from "../types/message";

interface UserSockets {
  [userId: string]: string;
}

const userSockets: UserSockets = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("join", ({ userId }:{userId:number}) => {
      userSockets[userId] = socket.id;
    });

    socket.on("send_message", (data: MessageData) => {
      const userId =
        Object.keys(userSockets).find(
          (userId) => userSockets[userId] === socket.id
        ) || null;
      io.emit("receive_message", data.message);
    });

    socket.on(
      "send_private_message",
      ({
        toUserId,
        fromUserId,
        message,
        timestamp,
      }: PrivateMessage) => {
        const targetSocketId = userSockets[toUserId];
        if (targetSocketId) {
          io.to(targetSocketId).emit("receive_private_message", {
            fromUserId,
            message,
            timestamp,
          });
        } else {
          console.log(`User ${toUserId} not connected.`);
        }
      }
    );

    socket.on("disconnect", () => {
      const userId = Object.keys(userSockets).find(
        (key) => userSockets[key] === socket.id
      );
      if (userId) {
        delete userSockets[userId];
      }
    });
  });
};
