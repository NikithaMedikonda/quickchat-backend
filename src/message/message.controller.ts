import { Request, Response } from "express";
import { Chat } from "../chat/chat.model";
import { findOrCreateChat } from "../chat/chat.service";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";
import { Message } from "./message.model";
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
    res.status(500).json({ message: "Creating message failed." });
  }
};
