import { Op } from "sequelize";
import { Server } from "socket.io";
import { Message, MessageStatus } from "../message/message.model";
import { PrivateMessage } from "../types/message";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";
import {
  disconnectUser,
  findUserSocketId,
  storeMessage,
  updateUserSocketId,
} from "./socket.service";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("join", async (phoneNumber: string) => {
      await updateUserSocketId(phoneNumber, socket.id);
    });

    socket.on(
      "send_private_message",
      async ({
        recipientPhoneNumber,
        senderPhoneNumber,
        message,
        timestamp,
      }: PrivateMessage) => {
        try {
          await storeMessage({
            recipientPhoneNumber,
            senderPhoneNumber,
            message,
            timestamp,
          });
          const senderId = await findByPhoneNumber(senderPhoneNumber);
          const receiverId = await findByPhoneNumber(recipientPhoneNumber);

          const targetSocketId = await findUserSocketId(recipientPhoneNumber);
          if (targetSocketId) {
            await Message.update(
              { status: "delivered" as MessageStatus },
              {
                where: {
                  senderId: senderId,
                  receiverId: receiverId,
                  status: "sent" as MessageStatus,
                  createdAt: {
                    [Op.lte]: new Date(timestamp),
                  },
                },
              }
            );
            io.to(targetSocketId).emit(
              `receive_private_message_${senderPhoneNumber}`,
              { recipientPhoneNumber, senderPhoneNumber, message, timestamp }
            );
          } 
        } catch (error) {
          throw new Error(
            `Failed to store or send message: ${(error as Error).message}`
          );
        }
      }
    );

    socket.on("disconnect", async () => {
      await disconnectUser(socket.id);
    });
  });
};
