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
      isLogin:false,
    });
    await createUser({
      phoneNumber: "+911234567890",
      firstName: "test",
      lastName: "receiver",
      password: "Receiver@1234",
      email: "receiver@gmail.com",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin:false,
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
    await request(app)
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

    await request(app)
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

    await request(app)
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

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayload)
      .expect(500);
  });

  test("should throw error if invalid senderId and receiverId are sent", async () => {
    await expect(findOrCreateChat("senderId", "receiverId")).rejects.toThrow(
      `SequelizeDatabaseError: invalid input syntax for type uuid: "receiverId"`
    );
  });

  test("should throw error if invalid senderId and receiverId are sent", async () => {
    await expect(createConversation("chatId", "userId")).rejects.toThrow(
      `SequelizeDatabaseError: invalid input syntax for type uuid: "chatId"`
    );
  });
});

describe("Testing the functionality of updating the status of the message", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  beforeAll(() => {
    testInstance = SequelizeConnection();
  });

  afterAll(async () => {
    await Message.truncate({ cascade: true });
    await Conversation.truncate({ cascade: true });
    await Chat.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    testInstance.close();
  });

  const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
  const senderPhoneNumber = "+916303974914";
  const receiverPhoneNumber = "+916303552765";
  let accessToken: string = "";

  test("should create two users in the database to have chat", async () => {
    const sender = await createUser({
      firstName: "Mammu",
      lastName: "Niyal",
      phoneNumber: senderPhoneNumber,
      password: "Pass@word1",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin:false,
    });
    const receiver = await createUser({
      firstName: "Varun",
      lastName: "Martha",
      phoneNumber: receiverPhoneNumber,
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin:false,
    });
    await createUser({
      firstName: "Test",
      lastName: "User",
      phoneNumber: "+919876543210",
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin:false,
    });
    accessToken = jwt.sign(
      { phoneNumber: senderPhoneNumber },
      secret_key.toString(),
      {
        expiresIn: "7d",
      }
    );
    expect(sender.id).toBeTruthy();
    expect(receiver.id).toBeTruthy();
  });

  test("should be able to store messages in the database", async () => {
    const messagePayloadA = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: "Hey Man! Wasup",
      timeStamp: "2025-05-21T11:44:00Z",
    };

    const messageAResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadA)
      .expect(200);

    expect(messageAResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageAResponse.body.messageDetails.status).toBe("sent");
    expect(messageAResponse.body.messageDetails.content).toBe("Hey Man! Wasup");

    const messagePayloadB = {
      senderPhoneNumber: receiverPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hey Mamatha, Hi",
      timeStamp: "2025-05-21T11:48:00Z",
    };

    const messageBResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadB)
      .expect(200);

    expect(messageBResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageBResponse.body.messageDetails.status).toBe("sent");
    expect(messageBResponse.body.messageDetails.content).toBe(
      "Hey Mamatha, Hi"
    );

    const messagePayloadC = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: "What are you doing?",
      timeStamp: "2025-05-21T11:50:00Z",
    };

    const messageCResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadC)
      .expect(200);

    expect(messageCResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageCResponse.body.messageDetails.status).toBe("sent");
    expect(messageCResponse.body.messageDetails.content).toBe(
      "What are you doing?"
    );

    const messagePayloadD = {
      senderPhoneNumber: receiverPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "I am chilling yar! What about you?",
      timeStamp: "2025-05-21T11:52:00Z",
    };

    const messageDResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadD)
      .expect(200);

    expect(messageDResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageDResponse.body.messageDetails.status).toBe("sent");
    expect(messageDResponse.body.messageDetails.content).toBe(
      "I am chilling yar! What about you?"
    );

    const messagePayloadE = {
      senderPhoneNumber: receiverPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Cool! Nothing much😊",
      timeStamp: "2025-05-21T11:55:00Z",
    };

    const messageEResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadE)
      .expect(200);

    expect(messageEResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageEResponse.body.messageDetails.status).toBe("sent");
    expect(messageEResponse.body.messageDetails.content).toBe(
      "Cool! Nothing much😊"
    );
  }, 10000);

  test("should throw error if required fields are not passed.", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      timestamp: "2025-05-21T11:52:00Z",
      currentStatus: "delivered",
    };
    await request(app)
      .put("/api/messages/status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(400);
  });

  test("should return 204 code as there are no message before the timestamp.", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      timestamp: "2025-05-21T11:00:00Z",
      previousStatus: "sent",
      currentStatus: "delivered",
    };
    await request(app)
      .put("/api/messages/status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(204);
  });

  test("should update the messages status before the provided timestamp", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      timestamp: "2025-05-21T11:52:00Z",
      previousStatus: "sent",
      currentStatus: "delivered",
    };
    const messageResponse = await request(app)
      .put("/api/messages/status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(200);
    expect(messageResponse.body.count).toBe(2);
  });

  test("should throw error if phone number provided is wrong", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: "+918787878787",
      timestamp: "2025-05-21T11:52:00Z",
      previousStatus: "sent",
      currentStatus: "delivered",
    };
    await request(app)
      .put("/api/messages/status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(500);
  });
});
