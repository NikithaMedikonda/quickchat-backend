import { Server } from "socket.io";
import { messaging } from "../../firebase";
import { PrivateMessage, updateMessageDetails } from "../types/message";
import { User } from "../user/user.model";
import { getBlockStatus } from "../userRestriction/userRestriction.controller";
import {
  changeStatusToDelivered,
  disconnectUser,
  findUserSocketId,
  getBlockedSocketIds,
  storeMessage,
  updateUserSocketId,
} from "./socket.service";
import { updateStatus } from "../message/message.controller";
import { getSavedName } from "../user_contacts/user_contacts.controller";

export const setupSocket = (io: Server) => {
  const chattingWithMap = new Map<string, string>();

  io.on("connection", (socket) => {
    socket.on("join", async (phoneNumber: string) => {
      const messages = await changeStatusToDelivered(phoneNumber);
      messages.forEach(async (msg) => {
        const sender = await User.findOne({ where: { id: msg.senderId } });
        const senderPhoneNumber = await sender?.dataValues.phoneNumber;
        io.emit(`delivered_status_${senderPhoneNumber}`, msg.message);
      });
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
          const user = await User.findOne({ where: { phoneNumber } });

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
          const chattingWith = targetSocketId
            ? chattingWithMap.get(targetSocketId)
            : null;

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

            io.emit("new_message", { newMessage: true });
            io.emit(`receive_private_message_${senderPhoneNumber}`, {
              recipientPhoneNumber,
              senderPhoneNumber,
              message,
              timestamp,
            });

            if (recipient?.fcmToken) {
              if (chattingWith !== senderPhoneNumber) {
                await messaging.send({
                  token: recipient.fcmToken,
                  data: {
                    title: `New message from ${sender?.firstName}`,
                    body: message,
                    profilePicture: sender?.profilePicture || "",
                    senderPhoneNumber,
                    recipientPhoneNumber,
                    timestamp: timestamp.toString(),
                    type: "private_message",
                  },
                });
              }
            }
          } else {
            if (!result) {
              const savedName = await getSavedName(
                recipientPhoneNumber,
                senderPhoneNumber
              );
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
                    title: `New message from ${savedName || senderPhoneNumber}`,
                    body: message,
                    profilePicture: sender?.profilePicture || "",
                    senderPhoneNumber,
                    recipientPhoneNumber,
                    timestamp: timestamp.toString(),
                    type: "private_message",
                  },
                });
              }
            }
          }
        } catch (error) {
          console.error(
            `Failed to store or send message: ${(error as Error).message}`
          );
        }
      }
    );

    socket.on("offline_with", async (withChattingPhoneNumber: string) => {
      chattingWithMap.delete(socket.id);
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
        console.error(
          `Error while fetching the user: ${(error as Error).message}`
        );
      }
    });

    socket.on("online_with", async (withChattingPhoneNumber: string) => {
      chattingWithMap.set(socket.id, withChattingPhoneNumber);
      try {
        const senderPhoneNumber = withChattingPhoneNumber;
        const user = await User.findOne({ where: { socketId: socket.id } });
        const receiverPhoneNumber = await user?.dataValues.phoneNumber;
        if (receiverPhoneNumber) {
          const updated = await updateStatus(
            senderPhoneNumber,
            receiverPhoneNumber,
            "delivered",
            "read"
          );
          if (updated.length > 0) {
            io.emit(
              `read_${senderPhoneNumber}_${receiverPhoneNumber}`,
              updated
            );
          }
        }
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
        console.error(
          `Error while fetching the user: ${(error as Error).message}`
        );
      }
    });
    socket.on("online", async (phoneNumber: string) => {
      try {
        const targetSocketId = await findUserSocketId(phoneNumber);
        if (targetSocketId) {
          io.to(targetSocketId).emit(`isOnline_${phoneNumber}`, {
            isOnline: true,
          });
        }
      } catch (error) {
        throw new Error(
          `Error while fetching the user ${(error as Error).message}`
        );
      }
    });
    socket.on("offline", async (phoneNumber: string) => {
      try {
        const targetSocketId = await findUserSocketId(phoneNumber);
        if (targetSocketId) {
          io.to(targetSocketId).emit(`isOffline_${phoneNumber}`, {
            isOnline: false,
          });
        }
      } catch (error) {
        throw new Error(
          `Error while fetching the user ${(error as Error).message}`
        );
      }
    });
    socket.on("read", async (data: updateMessageDetails) => {
      const receiverPhoneNumber = data.receiverPhoneNumber;
      const senderPhoneNumber = data.senderPhoneNumber;
      io.emit(
        `status_${receiverPhoneNumber}_${senderPhoneNumber}`,
        data.messages
      );
    });
    socket.on("disconnect", async () => {
      chattingWithMap.delete(socket.id);
      const user = await User.findOne({ where: { socketId: socket.id } });
      const phoneNumber = await user?.dataValues.phoneNumber;
      if (phoneNumber) {
        const exceptSocketIds = await getBlockedSocketIds(phoneNumber);
        socket.broadcast.except(exceptSocketIds).emit("I-deleted", {
          phoneNumber: phoneNumber,
        });
      }
      if (user) {
        await updateUserSocketId(user.phoneNumber, null);
        await disconnectUser(socket.id);
      }
    });
  });
};
