import { Server } from "socket.io";

interface UserSockets {
  [userId: string]: string;
}

const userSockets: UserSockets = {};

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("join", ({ userId }: any) => {
      userSockets[userId] = socket.id;
    });

    socket.on("send_message", (data: any) => {
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
      }: {
        toUserId: number;
        fromUserId: number;
        message: string;
        timestamp: any;
      }) => {
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
