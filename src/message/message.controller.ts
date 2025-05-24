import { Request, Response } from "express";
import { Op } from "sequelize";
import { Chat } from "../chat/chat.model";
import { findOrCreateChat } from "../chat/chat.service";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";
import { Message, MessageStatus } from "./message.model";
import { createMessage } from "./message.service";

export const postMessage = async (req: Request, res: Response) => {
  try {
    const senderPhoneNumber = req.body.senderPhoneNumber;
    const receiverPhoneNumber = req.body.receiverPhoneNumber;
    const text = req.body.content;
    const timeStamp = req.body.timeStamp;
    if (!senderPhoneNumber || !receiverPhoneNumber || !text || !timeStamp) {
      res
        .status(400)
        .json({ message: "Please provide all the necessary fields." });
      return;
    }
    const senderId = await findByPhoneNumber(senderPhoneNumber);
    const receiverId = await findByPhoneNumber(receiverPhoneNumber);
    const chat: Chat = await findOrCreateChat(senderId, receiverId);
    const message: Message = await createMessage(
      senderId,
      receiverId,
      chat.id,
      text,
      timeStamp
    );
    res.status(200).json({
      messageDetails: message,
    });
  } catch (error) {
     res
      .status(500)
      .json({ error: `Creating message failed. ${(error as Error).message}` });
  }
};

export const updateMessageStatus = async (req: Request, res: Response) => {
  try {
    const {
      senderPhoneNumber,
      receiverPhoneNumber,
      timestamp,
      previousStatus,
      currentStatus,
    } = req.body;
    const requiredFields = [
      senderPhoneNumber,
      receiverPhoneNumber,
      timestamp,
      previousStatus,
      currentStatus,
    ];
    if (
      requiredFields.some(
        (field: string) => field === undefined || field === null || field === ""
      )
    ) {
      res.status(400).json({ error: "Required fields are not provided." });
      return;
    }

    const senderId = await findByPhoneNumber(senderPhoneNumber);
    const receiverId = await findByPhoneNumber(receiverPhoneNumber);

    const [updatedCount] = await Message.update(
      { status: currentStatus as MessageStatus },
      {
        where: {
          senderId: senderId,
          receiverId: receiverId,
          status: previousStatus as MessageStatus,
          createdAt: {
            [Op.lte]: new Date(timestamp),
          },
        },
      }
    );

    if (updatedCount === 0) {
      res.status(204).end();
      return;
    }

    res
      .status(200)
      .json({ count: updatedCount, message: "Updated status of messages" });
    return;
  } catch (error) {
    res
      .status(500)
      .json({ error: `Error updating status: ${(error as Error).message}` });
  }
};