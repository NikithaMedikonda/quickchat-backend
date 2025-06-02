import { Server } from "socket.io";
import { PrivateMessage } from "../types/message";
import { User } from "../user/user.model";
import {
  changeStatusToDelivered,
  disconnectUser,
  findUserSocketId,
  storeMessage,
  updateUserSocketId,
} from "./socket.service";

export const setupSocket = (io: Server) => {
  io.on("connection", (socket) => {
    socket.on("join", async (phoneNumber: string) => {
      await changeStatusToDelivered(phoneNumber);
      await updateUserSocketId(phoneNumber, socket.id);
      socket.broadcast.emit("I-joined", {
        phoneNumber: phoneNumber,
        socketId: socket.id,
      });
    });

socket.on("check_user_device", async (phoneNumber: string, deviceId: string) => {
  try {
    const user = await User.findOne({
      where: { phoneNumber },
    });

    if (!user) {
      socket.emit("user_device_verified", { 
        success: false, 
        message: "User not found",
        action: "logout" 
      });
      return;
    }

    if (user.deviceId !== deviceId) {
      socket.emit("user_device_verified", { 
        success: false, 
        message: "Device mismatch - logged in from another device",
        action: "logout",
        registeredDeviceId: user.deviceId 
      });
    } else {
      socket.emit("user_device_verified", { 
        success: true, 
        message: "Device verified",
        action: "continue" 
      });
    }
  } catch (error) {
    socket.emit("user_device_verified", { 
      success: false, 
      message: "Server error during device verification",
      action: "logout" 
    });
    console.error(`Error while checking user device: ${(error as Error).message}`);
  }
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
          const targetSocketId = await findUserSocketId(recipientPhoneNumber);
          if (targetSocketId) {
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
          } else {
            await storeMessage({
              recipientPhoneNumber,
              senderPhoneNumber,
              message,
              status: "sent",
              timestamp,
            });
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
          io.to(targetSocketId).emit(`offline_with_${withChattingPhoneNumber}`, {
            online: false,
          });
        }
      } catch (error) {
        throw new Error(
          `Error while fetching the user ${(error as Error).message}`
        );
      }
    });

    socket.on(`online_with`, async (withChattingPhoneNumber: string) => {
      try {
        const targetSocketId = await findUserSocketId(withChattingPhoneNumber);
        if (targetSocketId) {
          io.to(targetSocketId).emit(`isOnline_with_${withChattingPhoneNumber}`, {
            isOnline: true,
          });
        }
      } catch (error) {
        throw new Error(
          `Error while fetching the user ${(error as Error).message}`
        );
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
