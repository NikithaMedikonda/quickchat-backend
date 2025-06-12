import { Server } from "socket.io";
import { PrivateMessage } from "../types/message";
import { User } from "../user/user.model";
import { messaging } from "../../firebase";
import {
  changeStatusToDelivered,
  disconnectUser,
  findUserSocketId,
  getBlockedSocketIds,
  storeMessage,
  updateUserSocketId,
} from "./socket.service";
import { getBlockStatus } from "../userRestriction/userRestriction.controller";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("join", async (phoneNumber: string) => {
      await changeStatusToDelivered(phoneNumber);
      await updateUserSocketId(phoneNumber, socket.id);
      const exceptSocketIds = await getBlockedSocketIds(phoneNumber);
      socket.broadcast.except(exceptSocketIds).emit("I-joined", {
        phoneNumber: phoneNumber,
        socketId: socket.id,
      });
    });
    socket.emit("internet_connection", { response: true });
    socket.on(
      "check_user_device",

      async (phoneNumber: string, deviceId: string) => {
        try {
          const user = await User.findOne({
            where: { phoneNumber },
          });

          if (!user) {
            socket.emit("user_device_verified", {
              success: false,
              message: "User not found",
              action: "logout",
            });
            return;
          }

          if (user.deviceId !== deviceId) {
            socket.emit("user_device_verified", {
              success: false,
              message: "Device mismatch - logged in from another device",
              action: "logout",
              registeredDeviceId: user.deviceId,
            });
          } else {
            socket.emit("user_device_verified", {
              success: true,
              message: "Device verified",
              action: "continue",
            });
          }
        } catch {
          socket.emit("user_device_verified", {
            success: false,
            message: "Server error during device verification",
            action: "logout",
          });
        }
      }
    );

    socket.on(
      "send_private_message",
      async ({
        recipientPhoneNumber,
        senderPhoneNumber,
        message,
        timestamp,
      }: PrivateMessage) => {
        try {
          const result = await getBlockStatus(
            recipientPhoneNumber,
            senderPhoneNumber
          );
          const targetSocketId = await findUserSocketId(recipientPhoneNumber);
          const recipient = await User.findOne({
            where: { phoneNumber: recipientPhoneNumber },
          });
          const sender = await User.findOne({
            where: { phoneNumber: senderPhoneNumber },
          });
          if (senderPhoneNumber === recipientPhoneNumber) {
            await storeMessage({
              recipientPhoneNumber,
              senderPhoneNumber,
              message,
              status: "read",
              timestamp,
            });
          } else if (targetSocketId && !result) {
            await storeMessage({
              recipientPhoneNumber,
              senderPhoneNumber,
              message,
              status: "delivered",
              timestamp,
            });
            io.to(targetSocketId).emit(
              `receive_private_message_${senderPhoneNumber}`,
              { recipientPhoneNumber, senderPhoneNumber, message, timestamp }
            );
            await io
              .to(targetSocketId)
              .emit("new_message", { newMessage: true });
            if (recipient?.fcmToken) {
                        await messaging.send({
            token: recipient.fcmToken,
            data: {
              title: `New message from ${sender?.firstName}`,
              body: message,
              profilePicture: sender?.profilePicture || "",
              senderPhoneNumber:senderPhoneNumber,
              recipientPhoneNumber,
              timestamp: timestamp.toString(),
              type: "private_message",
            },
          });
            }
          } else {
            await storeMessage({
              recipientPhoneNumber,
              senderPhoneNumber,
              message,
              status: "sent",
              timestamp,
            });
            if (recipient?.fcmToken) {
            await messaging.send({
            token: recipient.fcmToken,
            data: {
              title: `New message from ${sender?.firstName}`,
              body: message,
              profilePicture: sender?.profilePicture || "",
              senderPhoneNumber:senderPhoneNumber,
              recipientPhoneNumber,
              timestamp: timestamp.toString(),
              type: "private_message",
            },
          });
            }
          }
        } catch (error) {
          throw new Error(
            `Failed to store or send message: ${(error as Error).message}`
          );
        }
      }
    );
    socket.on("offline_with", async (withChattingPhoneNumber: string) => {
      try {
        const targetSocketId = await findUserSocketId(withChattingPhoneNumber);
        if (targetSocketId) {
          io.to(targetSocketId).emit(
            `offline_with_${withChattingPhoneNumber}`,
            {
              isOnline: false,
            }
          );
        }
      } catch (error) {
         console.error(`Error while fetching the user: ${(error as Error).message}`);
      }
    });

    socket.on(`online_with`, async (withChattingPhoneNumber: string) => {
      try {
        const targetSocketId = await findUserSocketId(withChattingPhoneNumber);
        if (targetSocketId) {
          io.to(targetSocketId).emit(
            `isOnline_with_${withChattingPhoneNumber}`,
            {
              isOnline: true,
            }
          );
        }
      } catch (error) {
        console.error(`Error while fetching the user: ${(error as Error).message}`);
      }
    });
    socket.on("disconnect", async () => {
      const user = await User.findOne({ where: { socketId: socket.id } });
      if (user) {
        await updateUserSocketId(user.phoneNumber, null);
        await disconnectUser(socket.id);
      }
    });
  });
};
