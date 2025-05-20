import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { Chat } from "../chat/chat.model";
import { findOrCreateChat } from "../chat/chat.service";
import { SequelizeConnection } from "../connection/dbconnection";
import { Conversation } from "../conversation/conversation.model";
import { createConversation } from "../conversation/conversation.service";
import { createUser } from "../user/user.controller";
import { User } from "../user/user.model";
import { Message } from "./message.model";

describe("Testing the functionality of storing message in data base", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  const senderPhoneNumber = "+919876543210";
  const receiverPhoneNumber = "+911234567890";
  let accessToken: string = "";

  beforeAll(async () => {
    testInstance = SequelizeConnection()!;
    const sender = await createUser({
      phoneNumber: "+919876543210",
      firstName: "test",
      lastName: "sender",
      password: "Send@1234",
      email: "sender@gmail.com",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
    });
    const receiver = await createUser({
      phoneNumber: "+911234567890",
      firstName: "test",
      lastName: "receiver",
      password: "Receiver@1234",
      email: "receiver@gmail.com",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
    });
    const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
    accessToken = jwt.sign(
      { phoneNumber: sender.phoneNumber },
      secret_key.toString(),
      {
        expiresIn: "7d",
      }
    );
  });

  afterAll(async () => {
    await Message.truncate({ cascade: true });
    await Conversation.truncate({ cascade: true });
    await Chat.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await testInstance.close();
  });

  test("Should throw error if necessary fields are not passed", async () => {
    const resource = {
      phoneNumber: "+9876543210",
      content: "Hi",
    };
    const response = await request(app)
      .post("/api/message")
      .send(resource)
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(400);
  });

  test("Should send the message successfully", async () => {
    const messagePayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: "Hello!",
      timeStamp: "2024-01-01T10:00:00Z",
    };

    const messageResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayload)
      .expect(200);

    expect(messageResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageResponse.body.messageDetails.content).toBe("Hello!");

    const chatId = messageResponse.body.messageDetails.chatId;
    const chat = await Chat.findOne({ where: { id: chatId } });

    expect(chat).not.toBeNull();
    expect(chat!.userAId).toBeDefined();
    expect(chat!.userBId).toBeDefined();

    const conversations = await Conversation.findAll({ where: { chatId } });
    expect(conversations.length).toBe(2);
  });

  test("Should throw error if user is not there with provided phone number", async () => {
    const messagePayload = {
      senderPhoneNumber: "+914567891234",
      receiverPhoneNumber: receiverPhoneNumber,
      content: "Hello!",
      timeStamp:"2024-01-01T10:00:00Z"
    };

    const messageResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayload)
      .expect(500);
  });

  test("Should throw error if message is not in appropriate format", async () => {
    const messagePayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: ["Hello!"],
      timeStamp:"2024-01-01T10:00:00Z"
    };

    const messageResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayload)
      .expect(500);
  });

  test("Should throw error if it fails to create chat", async () => {
    const messagePayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: ["Hello!"],
      timeStamp:"2024-01-01T10:00:00Z"
    };

    const messageResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayload)
      .expect(500);
  });

  test("should throw error if invalid senderId and receiverId are sent", async () => {
    await expect(findOrCreateChat("senderId", "receiverId")).rejects.toThrow(
      `SequelizeDatabaseError: invalid input syntax for type uuid: \"receiverId\"`
    );
  });

  test("should throw error if invalid senderId and receiverId are sent", async () => {
    await expect(createConversation("chatId", "userId")).rejects.toThrow(
      `SequelizeDatabaseError: invalid input syntax for type uuid: \"chatId\"`
    );
  });
});
