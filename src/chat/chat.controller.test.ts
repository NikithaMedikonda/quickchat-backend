import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { Chat } from "../chat/chat.model";
import { SequelizeConnection } from "../connection/dbconnection";
import { Conversation } from "../conversation/conversation.model";
import { Message } from "../message/message.model";
import { createUser } from "../user/user.controller";
import { User } from "../user/user.model";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";

describe("Testing the functionality of retrieving the messages of two users", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterEach(() => {
    process.env = originalEnv;
  });
  beforeAll(() => {
    testInstance = SequelizeConnection()!;
  });
  afterAll(async () => {
    await Message.truncate({ cascade: true });
    await Conversation.truncate({ cascade: true });
    await Chat.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    testInstance.close();
  });

  let accessToken: string = "";
  const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
  const senderPhoneNumber = "+916303974914";
  const receiverPhoneNumber = "+916303552765";
  let chatId: string = "";

  test("should create two users in the database to have chat", async () => {
    const sender = await createUser({
      firstName: "Mammu",
      lastName: "Niyal",
      phoneNumber: senderPhoneNumber,
      password: "Pass@word1",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
    });
    const receiver = await createUser({
      firstName: "Varun",
      lastName: "Martha",
      phoneNumber: receiverPhoneNumber,
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
    });
    const messager = await createUser({
      firstName: "Test",
      lastName: "User",
      phoneNumber: "+919876543210",
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
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

  test("should be able to store message in the database", async () => {
    const messagePayloadA = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: "Hey Man! Wasup",
      timeStamp: "2024-05-21T11:44:00Z",
    };

    const messageAResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadA)
      .expect(200);

    expect(messageAResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageAResponse.body.messageDetails.content).toBe("Hey Man! Wasup");
    chatId = messageAResponse.body.messageDetails.chatId;

    const messagePayloadB = {
      senderPhoneNumber: receiverPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hey Mamatha, Hi",
      timeStamp: "2024-05-21T11:48:00Z",
    };

    const messageBResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadB)
      .expect(200);

    expect(messageBResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageBResponse.body.messageDetails.content).toBe(
      "Hey Mamatha, Hi"
    );

    const messagePayloadC = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
      content: "What are you doing?",
      timeStamp: "2024-05-21T11:49:00Z",
    };

    const messageCResponse = await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messagePayloadC)
      .expect(200);

    expect(messageCResponse.body.messageDetails.senderId).toBeDefined();
    expect(messageCResponse.body.messageDetails.content).toBe(
      "What are you doing?"
    );
  });

  test("should throw error if necessary fields are not provided", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
    };
    const response = await request(app)
      .post("/api/users/messages")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(400);
  });

  test("should retrieve messages between users", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
    };
    const response = await request(app)
      .post("/api/users/messages")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(200);

    expect(Array.isArray(response.body.chats)).toBe(true);
    expect(response.body.chats.length).toBe(3);
    expect(response.body.chats[0].content).toBe("Hey Man! Wasup");
    expect(response.body.chats[1].content).toBe("Hey Mamatha, Hi");
    expect(response.body.chats[2].content).toBe("What are you doing?");
  });

  test("should respoonse with [] if no messages are there", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: "+919876543210",
    };
    const response = await request(app)
      .post("/api/users/messages")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(200);

    expect(response.body.chats).toEqual([]);
  });

  test("should display only messages after lastClearedAt", async () => {
    const userId = await findByPhoneNumber(senderPhoneNumber);
    await Conversation.update(
      { isDeleted: true, lastClearedAt: new Date("2024-05-21T11:45:00Z") },
      {
        where: {
          chatId: chatId,
          userId: userId,
        },
      }
    );

    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverPhoneNumber,
    };
    const response = await request(app)
      .post("/api/users/messages")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(200);

    expect(Array.isArray(response.body.chats)).toBe(true);
    expect(response.body.chats.length).toBe(2);
    expect(response.body.chats[0].content).not.toBe("Hey Man! Wasup");
    expect(response.body.chats[0].content).toBe("Hey Mamatha, Hi");
    expect(response.body.chats[1].content).toBe("What are you doing?");
  });
});
