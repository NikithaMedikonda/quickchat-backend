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

describe("Testing the delete chat functionality", () => {
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

  let accessToken: string = "";
  const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
  const senderPhoneNumber = "+916303974914";
  const receiverPhoneNumber = "+916303552765";

  test("should create users and setup token", async () => {
    const sender = await createUser({
      firstName: "Sender",
      lastName: "User",
      phoneNumber: senderPhoneNumber,
      password: "Pass@123",
      isDeleted: false,
      publicKey: "pubKey",
      privateKey: "privKey",
    });

    const receiver = await createUser({
      firstName: "Receiver",
      lastName: "User",
      phoneNumber: receiverPhoneNumber,
      password: "Pass@123",
      isDeleted: false,
      publicKey: "pubKey",
      privateKey: "privKey",
    });

    accessToken = jwt.sign({ phoneNumber: senderPhoneNumber }, secret_key, {
      expiresIn: "7d",
    });

    expect(sender.id).toBeTruthy();
    expect(receiver.id).toBeTruthy();
  });

  test("should return 404 if required fields are missing", async () => {
    const response = await request(app)
      .post("/api/chat/delete")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ senderPhoneNumber });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe(
      "Please provide all the necessary fields."
    );
  });

  test("should return 204 if chat does not exist", async () => {
    const response = await request(app)
      .post("/api/chat/delete")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        senderPhoneNumber,
        receiverPhoneNumber,
        timestamp: new Date().toISOString(),
      });
    expect(response.status).toBe(204);
  });

  test("should delete conversation successfully", async () => {
    const senderId = await findByPhoneNumber(senderPhoneNumber);
    const receiverId = await findByPhoneNumber(receiverPhoneNumber);

    const chat = await Chat.create({ userAId: senderId, userBId: receiverId });

    await Conversation.create({
      chatId: chat.id,
      userId: senderId,
      isDeleted: false,
      lastClearedAt: null,
    });

    const response = await request(app)
      .post("/api/chat/delete")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        senderPhoneNumber,
        receiverPhoneNumber,
        timestamp: new Date().toISOString(),
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Conversation deleted for the user.");
    expect(response.body.count).toBe(1);
  });

  test("should return 500 on internal server error", async () => {
    const res = await request(app)
      .post("/api/chat/delete")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        senderPhoneNumber,
        receiverPhoneNumber: "+91234567899",
        timestamp: new Date().toISOString(),
      });
    expect(res.status).toBe(500);
  });
});
