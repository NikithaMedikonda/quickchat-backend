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
import { findByUserId } from "../utils/findByPhoneNumber";

describe("Testing the functionality of retrieving the messages of two users", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterEach(async () => {
    process.env = originalEnv;
  });
  beforeAll(async () => {
    testInstance = SequelizeConnection()!;
    await Message.truncate({ cascade: true });
    await Conversation.truncate({ cascade: true });
    await Chat.truncate({ cascade: true });
    await User.truncate({ cascade: true });
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
      isLogin: false,
      deviceId: "qwertyuiop",
    });
    const receiver = await createUser({
      firstName: "Varun",
      lastName: "Martha",
      phoneNumber: receiverPhoneNumber,
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "asghdv",
    });
    await createUser({
      firstName: "Test",
      lastName: "User",
      phoneNumber: "+919876543210",
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "jhUSGYGUYDF",
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
      status: "delivered",
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
      status: "delivered",
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
      status: "delivered",
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
    await request(app)
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

  test("should response with [] if no messages are there", async () => {
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

  test("should return 500 status code if wrong phone number is given", async () => {
    const payload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: "+918787878787",
    };

    const response = await request(app)
      .post("/api/users/messages")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload);

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/User not found/i);
  }, 10000);
});

describe("Testing the functionality of retrieving all the messages of a user", () => {
  let testInstance: Sequelize;

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
  const receiverAPhoneNumber = "+916303552761";
  const receiverBPhoneNumber = "+916303552762";
  const receiverCPhoneNumber = "+916303552763";

  test("should create four users in the database to have chat", async () => {
    const sender = await createUser({
      firstName: "sender",
      lastName: "A",
      phoneNumber: senderPhoneNumber,
      password: "Pass@word1",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "abcd",
    });
    const receiverA = await createUser({
      firstName: "receiver",
      lastName: "A",
      phoneNumber: receiverAPhoneNumber,
      password: "Pass@word1",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "efgh",
    });
    const receiverB = await createUser({
      firstName: "receiver",
      lastName: "B",
      phoneNumber: receiverBPhoneNumber,
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "ijkl",
    });
    const receiverC = await createUser({
      firstName: "receiver",
      lastName: "C",
      phoneNumber: receiverCPhoneNumber,
      password: "Pass@word3",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "mnop",
    });
    accessToken = jwt.sign(
      { phoneNumber: senderPhoneNumber },
      secret_key.toString(),
      {
        expiresIn: "7d",
      }
    );
    expect(sender.id).toBeTruthy();
    expect(receiverA.id).toBeTruthy();
    expect(receiverB.id).toBeTruthy();
    expect(receiverC.id).toBeTruthy();
  });

  test("Should return 400 if necessary details are not provided", async () => {
    await request(app)
      .post("/api/chats/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .expect(400);
  });

  test("Should return empty array if user don't have any chats", async () => {
    const chatsOfSender = await request(app)
      .post("/api/chats/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ userPhoneNumber: senderPhoneNumber })
      .expect(200);
    expect(chatsOfSender.body.chats.length).toBe(0);
  });

  test("Should create necessary messages from sender to receiverA successfully", async () => {
    const messageAPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverAPhoneNumber,
      content: "Hello, I am sending you a message!",
      timeStamp: "2025-05-25T14:35:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageAPayload)
      .expect(200);

    const messageBPayload = {
      senderPhoneNumber: receiverAPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hello, I am giving reply to you!",
      timeStamp: "2025-05-25T14:38:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageBPayload)
      .expect(200);

    const messageCPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverAPhoneNumber,
      content: "Thanks for giving reply!",
      timeStamp: "2025-05-25T14:45:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageCPayload)
      .expect(200);
  });

  test("Should create necessary messages from sender to receiverB succesfully", async () => {
    const messageAPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverBPhoneNumber,
      content: "Hello, I am sending you a message!",
      timeStamp: "2025-05-25T14:50:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageAPayload)
      .expect(200);

    const messageBPayload = {
      senderPhoneNumber: receiverBPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hello, I am giving reply to you!",
      timeStamp: "2025-05-25T14:55:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageBPayload)
      .expect(200);

    const messageCPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverBPhoneNumber,
      content: "Thanks for giving reply!",
      timeStamp: "2025-05-25T15:00:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageCPayload)
      .expect(200);

    const messageDPayload = {
      senderPhoneNumber: receiverBPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Your welcome.",
      timeStamp: "2025-05-25T15:05:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageDPayload)
      .expect(200);
  });

  test("Should create necessary messages from sender to receiverC successfully", async () => {
    const messageAPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverCPhoneNumber,
      content: "Hello, I am sending you a message!",
      timeStamp: "2025-05-25T14:50:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageAPayload)
      .expect(200);

    const messageBPayload = {
      senderPhoneNumber: receiverCPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hello, I am giving reply to you!",
      timeStamp: "2025-05-25T14:55:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageBPayload)
      .expect(200);

    const messageCPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverCPhoneNumber,
      content: "Thanks for giving reply!",
      timeStamp: "2025-05-25T15:00:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageCPayload)
      .expect(200);

    const messageDPayload = {
      senderPhoneNumber: receiverCPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Your welcome.",
      timeStamp: "2025-05-25T15:05:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageDPayload)
      .expect(200);

    const messageEPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverCPhoneNumber,
      content: "Hello Again! Sorry for Deleting Chat with you.",
      timeStamp: "2025-05-25T15:10:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageEPayload)
      .expect(200);
  });

  test("should update the messages status sent by receiverB to sender before the provided timestamp", async () => {
    const payload = {
      senderPhoneNumber: receiverBPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      previousStatus: "sent",
      currentStatus: "read",
    };

    const messageResponse = await request(app)
      .put("/api/messages/status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(payload)
      .expect(200);
    expect(messageResponse.body.count).toBe(2);
  });

  test("should delete the chat with receiverC", async () => {
    const response = await request(app)
      .post("/api/chat/delete")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        senderPhoneNumber: senderPhoneNumber,
        receiverPhoneNumber: receiverCPhoneNumber,
        timestamp: "2025-05-25T15:15:00Z",
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Conversation deleted for the user.");
    expect(response.body.count).toBe(1);
  });

  test("Should create necessary messages from sender to sender successfully", async () => {
    const messageAPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hello, I am sending you a message!",
      timeStamp: "2025-05-25T14:50:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageAPayload)
      .expect(200);

    const messageBPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: senderPhoneNumber,
      content: "Hello, I am giving reply to you!",
      timeStamp: "2025-05-25T14:55:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageBPayload)
      .expect(200);
  });

  test("should fetch the chats of sender with receiverA and receiverBnp successfully", async () => {
    const chatsOfSender = await request(app)
      .post("/api/chats/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ userPhoneNumber: senderPhoneNumber })
      .expect(200);

    expect(Array.isArray(chatsOfSender.body.chats)).toBe(true);
    expect(chatsOfSender.body.chats).toHaveLength(3);

    const receiverBChat = chatsOfSender.body.chats[0];
    const selfChat = chatsOfSender.body.chats[1];
    const receiverAChat = chatsOfSender.body.chats[2];

    expect(selfChat).toBeDefined();
    expect(selfChat.chatId).toBeTruthy();
    expect(selfChat.contactName).toBe("sender A");
    expect(selfChat.contactProfilePic).toBeNull();
    expect(selfChat.phoneNumber).toBe(senderPhoneNumber);
    expect(selfChat.lastMessageText).toBe("Hello, I am giving reply to you!");
    expect(selfChat.lastMessageType).toBe("sentMessage");
    expect(selfChat.lastMessageStatus).toBe("sent");
    expect(selfChat.lastMessageTimestamp).toBe("2025-05-25T14:55:00.000Z");
    expect(selfChat.unreadCount).toBe(2);
    expect(selfChat.publicKey).toBeTruthy();

    expect(receiverBChat).toBeDefined();
    expect(receiverBChat.chatId).toBeTruthy();
    expect(receiverBChat.contactName).toBe("receiver B");
    expect(receiverBChat.contactProfilePic).toBeNull();
    expect(receiverBChat.phoneNumber).toBe(receiverBPhoneNumber);
    expect(receiverBChat.lastMessageText).toBe("Your welcome.");
    expect(receiverBChat.lastMessageType).toBe("receivedMessage");
    expect(receiverBChat.lastMessageStatus).toBeNull();
    expect(receiverBChat.lastMessageTimestamp).toBe("2025-05-25T15:05:00.000Z");
    expect(receiverBChat.unreadCount).toBe(0);
    expect(receiverBChat.publicKey).toBeTruthy();

    expect(receiverAChat).toBeDefined();
    expect(receiverAChat.chatId).toBeTruthy();
    expect(receiverAChat.contactName).toBe("receiver A");
    expect(receiverAChat.contactProfilePic).toBeNull();
    expect(receiverAChat.phoneNumber).toBe(receiverAPhoneNumber);
    expect(receiverAChat.lastMessageText).toBe("Thanks for giving reply!");
    expect(receiverAChat.lastMessageType).toBe("sentMessage");
    expect(receiverAChat.lastMessageStatus).toBe("sent");
    expect(receiverAChat.lastMessageTimestamp).toBe("2025-05-25T14:45:00.000Z");
    expect(receiverAChat.unreadCount).toBe(1);
    expect(receiverAChat.publicKey).toBeTruthy();
  });

  test("should fetch chats of receiverA with sender", async () => {
    const chatsOfSender = await request(app)
      .post("/api/chats/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ userPhoneNumber: receiverAPhoneNumber })
      .expect(200);

    expect(Array.isArray(chatsOfSender.body.chats)).toBe(true);
    expect(chatsOfSender.body.chats).toHaveLength(1);

    const chat = chatsOfSender.body.chats[0];

    expect(chat).toBeDefined();
    expect(chat.chatId).toBeTruthy();
    expect(chat.contactName).toBe("sender A");
    expect(chat.contactProfilePic).toBeNull();
    expect(chat.phoneNumber).toBe(senderPhoneNumber);
    expect(chat.lastMessageText).toBe("Thanks for giving reply!");
    expect(chat.lastMessageType).toBe("receivedMessage");
    expect(chat.lastMessageStatus).toBeNull();
    expect(chat.lastMessageTimestamp).toBe("2025-05-25T14:45:00.000Z");
    expect(chat.unreadCount).toBe(2);
    expect(chat.publicKey).toBeTruthy();
  });

  test("should include chat in results when lastClearedAt is before the last message", async () => {
    const messageAPayload = {
      senderPhoneNumber: senderPhoneNumber,
      receiverPhoneNumber: receiverCPhoneNumber,
      content: "Message after clearing",
      timeStamp: "2025-05-25T18:10:00Z",
      status: "sent",
    };

    await request(app)
      .post("/api/message")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(messageAPayload)
      .expect(200);

    const chatsOfSender = await request(app)
      .post("/api/chats/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ userPhoneNumber: senderPhoneNumber })
      .expect(200);

    const receiverCChat = chatsOfSender.body.chats[0];

    expect(receiverCChat).toBeDefined();
    expect(receiverCChat.lastMessageText).toBe("Message after clearing");
    expect(receiverCChat.lastMessageTimestamp).toBe("2025-05-25T18:10:00.000Z");
  });

  test("should throw error if phone number provided is wrong", async () => {
    await request(app)
      .post("/api/chats/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ userPhoneNumber: "+919876543210" })
      .expect(500);
  });
});

describe("Testing the functionality of syncing messages", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";

  const senderPhoneNumber = "+919999999999";
  const receiverPhoneNumber = "+918888888888";
  let accessToken = "";
  let chatId: string = "";

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  beforeAll(async () => {
    testInstance = SequelizeConnection()!;
    await Message.truncate({ cascade: true });
    await Conversation.truncate({ cascade: true });
    await Chat.truncate({ cascade: true });
    await User.truncate({ cascade: true });

    const sender = {
      firstName: "Mammu",
      lastName: "Niyal",
      phoneNumber: senderPhoneNumber,
      password: "Pass@word1",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "qwertyuiop",
      email: "mammu@gmail.com",
    };

    const receiver = {
      firstName: "Varun",
      lastName: "Martha",
      phoneNumber: receiverPhoneNumber,
      password: "Pass@word2",
      isDeleted: false,
      publicKey: "publicKey",
      privateKey: "privateKey",
      isLogin: false,
      deviceId: "ajhgdjagjsg",
      email: "varun@gmail.com",
    };

    const userA = await request(app)
      .post("/api/users")
      .send(sender)
      .expect(200);

    const userB = await request(app)
      .post("/api/users")
      .send(receiver)
      .expect(200);

    accessToken = jwt.sign({ phoneNumber: senderPhoneNumber }, secret_key, {
      expiresIn: "7d",
    });

    if (!userA.body.user.id || !userB.body.user.id) {
      throw new Error("User ID not returned in /api/users response.");
    }

    const chat = await Chat.create({
      userAId: userA.body.user.id,
      userBId: userB.body.user.id,
    });
    chatId = chat.id;

    await Conversation.create({
      chatId,
      userId: userA.body.user.id,
      isDeleted: false,
    });
    await Conversation.create({
      chatId,
      userId: userB.body.user.id,
      isDeleted: false,
    });

    const messages = [
      {
        senderPhoneNumber,
        receiverPhoneNumber,
        content: "Hey Man! Wasup",
        timeStamp: "2025-05-21T11:44:00Z",
        status: "sent",
      },
      {
        senderPhoneNumber: receiverPhoneNumber,
        receiverPhoneNumber: senderPhoneNumber,
        content: "Hey Mamatha, Hi",
        timeStamp: "2025-05-21T11:48:00Z",
        status: "sent",
      },
      {
        senderPhoneNumber,
        receiverPhoneNumber,
        content: "What are you doing?",
        timeStamp: "2025-05-21T11:50:00Z",
        status: "sent",
      },
    ];

    for (const msg of messages) {
      const token =
        msg.senderPhoneNumber === senderPhoneNumber
          ? accessToken
          : jwt.sign({ phoneNumber: receiverPhoneNumber }, secret_key, {
              expiresIn: "7d",
            });

      await request(app)
        .post("/api/message")
        .set("Authorization", `Bearer ${token}`)
        .send(msg)
        .expect(200);
    }
  }, 10000);

  afterAll(async () => {
    await Message.truncate({ cascade: true });
    await Conversation.truncate({ cascade: true });
    await Chat.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await testInstance.close();
  });

  test("should return messages for sync after lastSyncedAt", async () => {
    const response = await request(app)
      .post("/api/sync")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        userPhoneNumber: senderPhoneNumber,
        lastSyncedAt: "2024-06-01T09:00:00Z",
      })
      .expect(200);

    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const messageSync = data.find((d: Message) => d.chatId === chatId);
    expect(messageSync.senderPhoneNumber).toBe(receiverPhoneNumber);
    expect(messageSync.messages.length).toBe(1);
    expect(messageSync.messages[0].content).toBe("Hey Mamatha, Hi");
  });

  test("should return empty messages if lastSyncedAt is newer than all messages", async () => {
    const response = await request(app)
      .post("/api/sync")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        userPhoneNumber: senderPhoneNumber,
        lastSyncedAt: "2025-06-01T00:00:00Z",
      })
      .expect(200);

    const data = response.body.data;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].messages.length).toBe(0);
  });

  test("should return 400 for missing userPhoneNumber", async () => {
    const response = await request(app)
      .post("/api/sync")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ lastSyncedAt: "2024-06-01T00:00:00Z" })
      .expect(400);

    expect(response.body.message).toBe("Phone number is required.");
  });

  test("should prioritize lastClearedAt over lastSyncedAt when lastClearedAt is newer", async () => {
    const sender = await User.findOne({
      where: { phoneNumber: senderPhoneNumber },
    });
    const convo = await Conversation.findOne({ where: { userId: sender?.id } });

    await convo?.update({ lastClearedAt: new Date("2025-06-10T00:00:00Z") });

    const response = await request(app)
      .post("/api/sync")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        userPhoneNumber: senderPhoneNumber,
        lastSyncedAt: "2025-06-01T00:00:00Z",
      })
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.data[0].messages.length).toBeLessThanOrEqual(3);
  });

  test("should return 500 for non-existing userPhoneNumber", async () => {
    const response = await request(app)
      .post("/api/sync")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        userPhoneNumber: "+911111111111",
        lastSyncedAt: "2024-06-01T00:00:00Z",
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/Failed to fetch messages/i);
  });
  

  test("should return phoneNumber when valid userId is passed", async () => {
    const user = await User.findOne({
      where: { phoneNumber: senderPhoneNumber },
    });
    expect(user).toBeTruthy();

    const phoneNumber = await findByUserId(user!.id);
    expect(phoneNumber).toBe(senderPhoneNumber);
  });

  test("should throw error when invalid userId is passed", async () => {
    const invalidUserId = "29be6ac2-8ec3-4663-abf7-84fc2092a2a4";

    await expect(findByUserId(invalidUserId)).rejects.toThrow(
      "User not found with the Id"
    );
  });

  test("should throw error if User.findOne fails", async () => {
    await expect(findByUserId("some-id")).rejects.toThrow(
      "Error while fetching the user invalid input syntax for type uuid: \"some-id\""
    );
  });
});
