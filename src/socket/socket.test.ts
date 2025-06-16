import { Server as HttpServer } from "http";
import { Sequelize } from "sequelize";
import { Server as SocketIOServer } from "socket.io";
import Client, { Socket as ClientSocket } from "socket.io-client";
import { app } from "../../server";
import { Chat } from "../chat/chat.model";
import { findOrCreateChat } from "../chat/chat.service";
import { SequelizeConnection } from "../connection/dbconnection";
import { Message } from "../message/message.model";
import { User } from "../user/user.model";
import { setupSocket } from "./socket";
import * as userUtils from "./socket.service";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";
import { messaging } from "../../firebase";

let io: SocketIOServer;
let httpServer: HttpServer;
let clientA: ClientSocket;
let clientB: ClientSocket;

const TEST_PORT = 5001;
const SERVER_URL = `http://localhost:${TEST_PORT}`;

let testInstance: Sequelize;

beforeAll((done) => {
  httpServer = app.listen(TEST_PORT, () => {
    io = new SocketIOServer(httpServer);
    setupSocket(io);
    done();
  });
  testInstance = SequelizeConnection();
});

afterAll(async () => {
  io.close();
  httpServer.close();
  if (clientA?.connected) clientA.disconnect();
  if (clientB?.connected) clientB.disconnect();

  await Message.truncate({ cascade: true });
  await Chat.truncate({ cascade: true });
  await User.truncate({ cascade: true });
  await testInstance.close();
});

beforeEach(async () => {
  await Message.truncate({ cascade: true });
  await Chat.truncate({ cascade: true });
  await User.truncate({ cascade: true });
});
afterEach(() => {
  if (clientA?.connected) clientA.disconnect();
  if (clientB?.connected) clientB.disconnect();
});
describe("Test for socket", () => {
  test("should create users to chat", async () => {
    const sender = {
      phoneNumber: "+919440058809",
      firstName: "Anoosha",
      lastName: "Sanugula",
      email: "anoosha@gmail.com",
      password: "Anu@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: true,
      deviceId: "",
    };

    const user1 = await User.create(sender);

    const receiver = {
      phoneNumber: "+919440058801",
      firstName: "Bingi",
      lastName: "S",
      email: "bingi@gmail.com",
      password: "Anu@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: true,
      deviceId: "",
    };

    const user2 = await User.create(receiver);
    const chat = await findOrCreateChat(user1.id, user2.id);

    expect(user1).toBeDefined();
    expect(user2).toBeDefined();
    expect(chat).toBeDefined();
  });

  test("should verify device for check_user_device event", (done) => {
    const phoneNumber = "+919440058888";
    const correctDeviceId = "device123";
    const incorrectDeviceId = "wrongDevice";

    User.create({
      phoneNumber,
      firstName: "Device",
      lastName: "Checker",
      email: "devicechecker@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: correctDeviceId,
    })
      .then(() => {
        clientA = Client(SERVER_URL);

        clientA.on("connect", () => {
          clientA.emit("check_user_device", phoneNumber, correctDeviceId);

          clientA.once("user_device_verified", (response1) => {
            expect(response1).toEqual({
              success: true,
              message: "Device verified",
              action: "continue",
            });

            clientA.emit("check_user_device", phoneNumber, incorrectDeviceId);

            clientA.once("user_device_verified", (response2) => {
              expect(response2).toEqual({
                success: false,
                message: "Device mismatch - logged in from another device",
                action: "logout",
                registeredDeviceId: correctDeviceId,
              });

              clientA.emit("check_user_device", "+0000000000", "anyDevice");

              clientA.once("user_device_verified", (response3) => {
                expect(response3).toEqual({
                  success: false,
                  message: "User not found",
                  action: "logout",
                });
                done();
              });
            });
          });
        });
      })
      .catch(done);
  }, 15000);

  test("should handle error during device verification and emit server error message", (done) => {
    const phoneNumber = "+919440058888";
    const deviceId = "device123";
    const mockFindOne = jest
      .spyOn(User, "findOne")
      .mockRejectedValue(new Error("DB Error"));

    clientA = Client(SERVER_URL);
    clientA.on("connect", () => {
      clientA.emit("check_user_device", phoneNumber, deviceId);

      clientA.once("user_device_verified", (response) => {
        expect(response).toEqual({
          success: false,
          message: "Server error during device verification",
          action: "logout",
        });
        mockFindOne.mockRestore();
        done();
      });
    });
  }, 15000);

  test("should handle join event, update socket ID and broadcast to other users", (done) => {
    const phoneNumber = "+919440058803";

    User.create({
      phoneNumber,
      firstName: "Test",
      lastName: "User",
      email: "test@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }).then(() => {
      clientA = Client(SERVER_URL);
      clientA.on("connect", () => {
        clientA.on("I-joined", async (data) => {
          expect(data).toEqual({
            phoneNumber: phoneNumber,
            socketId: expect.any(String),
          });

          const user = await User.findOne({ where: { phoneNumber } });
          expect(user?.socketId).toBe(data.socketId);
          done();
        });

        clientB = Client(SERVER_URL);
        clientB.on("connect", () => {
          clientB.emit("join", phoneNumber);
        });
      });
    });
  }, 10000);

  test("should send a private message when recipient is online", (done) => {
    const message = "Hello privately!";
    const timestamp = new Date().toISOString();
    const senderPhoneNumber = "+919440058809";
    const recipientPhoneNumber = "+919440058801";

    Promise.all([
      User.create({
        phoneNumber: senderPhoneNumber,
        firstName: "Sender",
        lastName: "User",
        email: "sender@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
      User.create({
        phoneNumber: recipientPhoneNumber,
        firstName: "Recipient",
        lastName: "User",
        email: "recipient@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
    ])
      .then(async ([sender, recipient]) => {
        await findOrCreateChat(sender.id, recipient.id);

        clientB = Client(SERVER_URL);
        clientB.on("connect", () => {
          clientB.emit("join", recipientPhoneNumber);

          clientB.on(
            `receive_private_message_${senderPhoneNumber}`,
            async (data) => {
              try {
                expect(data).toEqual({
                  recipientPhoneNumber,
                  senderPhoneNumber,
                  message,
                  timestamp,
                });

                const storedMessage = await Message.findOne({
                  where: { senderId: sender.id, receiverId: recipient.id },
                });
                expect(storedMessage?.status).toBe("delivered");
                expect(storedMessage?.content).toBe(message);
                done();
              } catch (error) {
                done(error);
              }
            }
          );
          setTimeout(() => {
            clientA = Client(SERVER_URL);
            clientA.on("connect", () => {
              clientA.emit("join", senderPhoneNumber);

              setTimeout(() => {
                clientA.emit("send_private_message", {
                  recipientPhoneNumber,
                  senderPhoneNumber,
                  message,
                  timestamp,
                });
              }, 500);
            });
          }, 500);
        });
      })
      .catch(done);
  }, 20000);

  test("should store message as 'sent' when recipient is offline", (done) => {
    const message = "Message to offline user";
    const timestamp = new Date().toISOString();
    const senderPhoneNumber = "+919440058806";
    const recipientPhoneNumber = "+919440058807";

    const findUserSocketIdMock = jest
      .spyOn(userUtils, "findUserSocketId")
      .mockResolvedValue(null);
    const ioToMock = jest.spyOn(io, "to");

    Promise.all([
      User.create({
        phoneNumber: senderPhoneNumber,
        firstName: "Sender",
        lastName: "User",
        email: "sender@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
      User.create({
        phoneNumber: recipientPhoneNumber,
        firstName: "Recipient",
        lastName: "User",
        email: "recipient@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
    ]).then(async ([sender, recipient]) => {
      await findOrCreateChat(sender.id, recipient.id);

      clientA = Client(SERVER_URL);
      clientA.on("connect", () => {
        clientA.emit("join", senderPhoneNumber);
        clientA.emit("send_private_message", {
          recipientPhoneNumber,
          senderPhoneNumber,
          message,
          timestamp,
        });
        setTimeout(async () => {
          const storedMessage = await Message.findOne({
            where: { senderId: sender.id, receiverId: recipient.id },
          });
          expect(storedMessage?.status).toBe("sent");
          expect(storedMessage?.content).toBe(message);
          expect(ioToMock).not.toHaveBeenCalled(); 
          findUserSocketIdMock.mockRestore();
          ioToMock.mockRestore();
          done();
        }, 2000);
      });
    });
  }, 20000);

  test("should handle online_with event when target user is online", async () => {
    const user1PhoneNumber = "+919440058813";
    const user2PhoneNumber = "+919440058814";
    const dummySocketId = "dummy-socket-id";


    await Promise.all([
    User.create({
      phoneNumber: user1PhoneNumber,
      firstName: "User1",
      lastName: "Test",
      email: "user1@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }),
    User.create({
      phoneNumber: user2PhoneNumber,
      firstName: "User2",
      lastName: "Test",
      email: "user2@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }),
  ]);
    

    const findUserSocketIdMock = jest
      .spyOn(userUtils, "findUserSocketId")
      .mockResolvedValue(dummySocketId);
    const emitMock = jest.fn();
    const ioToMock = jest
      .spyOn(io, "to")
      .mockReturnValue({ emit: emitMock } as never);

    clientA = Client(SERVER_URL);

    await new Promise<void>((resolve) => {
      clientA.on("connect", () => {
        clientA.emit("join", user1PhoneNumber);
        clientA.emit("online_with", user2PhoneNumber);

        setTimeout(() => {
          expect(ioToMock).toHaveBeenCalledWith(dummySocketId);
          expect(emitMock).toHaveBeenCalledWith(
            `isOnline_with_${user2PhoneNumber}`,
            { isOnline: true }
          );

          ioToMock.mockRestore();
          findUserSocketIdMock.mockRestore();
          resolve();
        }, 1000);
      });
    });
  }, 10000);

  test("should handle offline_with event when target user is offline", (done) => {
    const user1PhoneNumber = "+919440058815";
    const user2PhoneNumber = "+919440058816";
    Promise.all([
      User.create({
        phoneNumber: user1PhoneNumber,
        firstName: "User1",
        lastName: "Test",
        email: "user1@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
      User.create({
        phoneNumber: user2PhoneNumber,
        firstName: "User2",
        lastName: "Test",
        email: "user2@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
    ]).then(() => {
      clientA = Client(SERVER_URL);
      clientA.on("connect", () => {
        clientA.emit("join", user1PhoneNumber);
        clientA.emit("offline_with", user2PhoneNumber);
        setTimeout(() => {
          done();
        }, 1000);
      });
    });
  }, 10000);
  test("should not emit offline_with_* event if target user is offline", (done) => {
    const user1PhoneNumber = "+919440058815";
    const user2PhoneNumber = "+919440058816";

    Promise.all([
      User.create({
        phoneNumber: user1PhoneNumber,
        firstName: "User1",
        lastName: "Test",
        email: "user1@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
      User.create({
        phoneNumber: user2PhoneNumber,
        firstName: "User2",
        lastName: "Test",
        email: "user2@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
    ]).then(() => {
      clientA = Client(SERVER_URL);

      const spy = jest.spyOn(clientA.io, "emit");

      clientA.on("connect", () => {
        clientA.emit("join", user1PhoneNumber);
        clientA.emit("offline_with", user2PhoneNumber);

        setTimeout(() => {
          expect(spy).not.toHaveBeenCalledWith(
            `offline_with_${user2PhoneNumber}`,
            expect.anything()
          );
          spy.mockRestore();
          done();
        }, 1000);
      });
    });
  }, 10000);

  test("should not emit if targetSocketId is not found for online_with", async () => {
    const userPhoneNumber = "+919440058817";

    const findUserSocketIdMock = jest
      .spyOn(userUtils, "findUserSocketId")
      .mockResolvedValue(null);

    clientA = Client(SERVER_URL);
    const ioToEmitMock = jest
      .spyOn(io, "to")
      .mockReturnValue({ emit: jest.fn() } as never);

    await new Promise<void>((resolve) => {
      clientA.on("connect", () => {
        clientA.emit("online_with", userPhoneNumber);
        setTimeout(() => {
          expect(ioToEmitMock).not.toHaveBeenCalled();
          ioToEmitMock.mockRestore();
          findUserSocketIdMock.mockRestore();
          resolve();
        }, 1000);
      });
    });
  }, 10000);

  test("should not emit if targetSocketId is not found for offline_with", async () => {
    const userPhoneNumber = "+919440058818";
    const findUserSocketIdMock = jest
      .spyOn(userUtils, "findUserSocketId")
      .mockResolvedValue(null);

    clientA = Client(SERVER_URL);
    const ioToEmitMock = jest
      .spyOn(io, "to")
      .mockReturnValue({ emit: jest.fn() } as never);

    await new Promise<void>((resolve) => {
      clientA.on("connect", () => {
        clientA.emit("offline_with", userPhoneNumber);
        setTimeout(() => {
          expect(ioToEmitMock).not.toHaveBeenCalled();
          ioToEmitMock.mockRestore();
          findUserSocketIdMock.mockRestore();
          resolve();
        }, 1000);
      });
    });
  }, 10000);

  test("should log error if findUserSocketId fails", (done) => {
    const user1PhoneNumber = "+919440058815";
    const user2PhoneNumber = "+919440058816";

    jest.spyOn(userUtils, "findUserSocketId").mockImplementationOnce(() => {
      throw new Error("DB failure");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    User.create({
      phoneNumber: user1PhoneNumber,
      firstName: "User1",
      lastName: "Test",
      email: "user1@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }).then(() => {
      clientA = Client(SERVER_URL);

      clientA.on("connect", () => {
        clientA.emit("join", user1PhoneNumber);
        clientA.emit("offline_with", user2PhoneNumber);

        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            "Error while fetching the user: DB failure"
          );
          consoleSpy.mockRestore();
          done();
        }, 500);
      });
    });
  });

  test("should not emit onine_with_* event if target user is online", (done) => {
    const user1PhoneNumber = "+919440058810";
    const user2PhoneNumber = "+919440058811";

    Promise.all([
      User.create({
        phoneNumber: user1PhoneNumber,
        firstName: "User1",
        lastName: "Test",
        email: "user3@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
      User.create({
        phoneNumber: user2PhoneNumber,
        firstName: "User2",
        lastName: "Test",
        email: "user4@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
    ]).then(() => {
      clientA = Client(SERVER_URL);

      const spy = jest.spyOn(clientA.io, "emit");

      clientA.on("connect", () => {
        clientA.emit("join", user1PhoneNumber);
        clientA.emit("isOnline_with_", user2PhoneNumber);

        setTimeout(() => {
          expect(spy).not.toHaveBeenCalledWith(
            `isOnline_with_${user2PhoneNumber}`,
            expect.anything()
          );
          spy.mockRestore();
          done();
        }, 1000);
      });
    });
  }, 10000);

  test("should log error if findUserSocketId fails", (done) => {
    const user1PhoneNumber = "+919440058815";
    const user2PhoneNumber = "+919440058816";

    jest.spyOn(userUtils, "findUserSocketId").mockImplementationOnce(() => {
      throw new Error("DB failure");
    });

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    User.create({
      phoneNumber: user1PhoneNumber,
      firstName: "User1",
      lastName: "Test",
      email: "user1@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }).then(() => {
      clientA = Client(SERVER_URL);

      clientA.on("connect", () => {
        clientA.emit("join", user1PhoneNumber);
        clientA.emit("online_with", user2PhoneNumber);
        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            "Error while fetching the user: DB failure"
          );
          consoleSpy.mockRestore();
          done();
        }, 500);
      });
    });
  });

  test("should handle duplicate join event gracefully", (done) => {
    const phoneNumber = "+919440058850";

    User.create({
      phoneNumber,
      firstName: "Duplicate",
      lastName: "Join",
      email: "duplicate@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }).then(() => {
      clientA = Client(SERVER_URL);
      clientA.on("connect", () => {
        clientA.emit("join", phoneNumber);
        clientA.emit("join", phoneNumber);

        setTimeout(async () => {
          const user = await User.findOne({ where: { phoneNumber } });
          expect(user?.socketId).toBeDefined();
          done();
        }, 1000);
      });
    });
  }, 10000);

  test("should store message with status 'read' when sender and recipient are the same", (done) => {
    const senderPhoneNumber = "+919440058816";
    const message = "Self message test";
    const timestamp = Date.now();
    const recipientPhoneNumber = "+919440058816";
    User.create({
      phoneNumber: senderPhoneNumber,
      firstName: "Self",
      lastName: "User",
      email: "selfuser@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    }).then(() => {
      clientA = Client(SERVER_URL);
      clientA.on("connect", () => {
        clientA.emit("join", senderPhoneNumber);
        clientA.emit("send_private_message", {
          recipientPhoneNumber,
          senderPhoneNumber,
          message,
          timestamp,
        });

        setTimeout(async () => {
          const userId = await findByPhoneNumber(senderPhoneNumber);
          const storedMessage = await Message.findOne({
            where: {
              senderId: userId,
              receiverId: userId,
            },
          });
          expect(storedMessage).toBeTruthy();
          expect(storedMessage?.content).toBe(message);
          expect(storedMessage?.status).toBe("read");

          done();
        }, 5000);
      });
    });
  }, 50000);

  test("should send FCM notification when recipient is online", (done) => {
    const senderPhoneNumber = "+919440058816";
    const recipientPhoneNumber = "+919440058817";
    const message = "Test message for FCM";
    const timestamp = Date.now();
    Promise.all([
      User.create({
        phoneNumber: senderPhoneNumber,
        firstName: "Sender",
        lastName: "Test",
        email: "sender@gmail.com",
        password: "Test@123",
        fcmToken: "dummySenderToken",
        socketId: "dummy-socket",
        isLogin: true,
        deviceId: "",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
      }),
      User.create({
        phoneNumber: recipientPhoneNumber,
        firstName: "Recipient",
        lastName: "Test",
        email: "recipient@gmail.com",
        password: "Test@123",
        fcmToken: "dummyRecipientToken",
        socketId: null,
        isLogin: false,
        deviceId: "",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
      }),
    ]);

    const sendMock = jest.spyOn(messaging, "send").mockResolvedValue("success");

    clientA = Client(SERVER_URL);

    clientA.on("connect", () => {
      clientA.emit("join", senderPhoneNumber);
      clientA.emit("send_private_message", {
        recipientPhoneNumber,
        senderPhoneNumber,
        message,
        timestamp,
      });

      setTimeout(() => {
        expect(sendMock).toHaveBeenCalledTimes(1);
        sendMock.mockRestore();
        done();
      }, 5000);
    });
  }, 120000);

  test("should store message with status 'sent' when recipient is offline", (done) => {
    const senderPhoneNumber = "+919440058816";
    const recipientPhoneNumber = "+919440058818";
    const message = "Offline recipient test";
    const timestamp = Date.now();

    Promise.all([
      User.create({
        phoneNumber: senderPhoneNumber,
        firstName: "Sender",
        lastName: "User",
        email: "sender3@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
      User.create({
        phoneNumber: recipientPhoneNumber,
        firstName: "Recipient",
        lastName: "User",
        email: "recipient3@gmail.com",
        password: "Test@123",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: null,
        isLogin: false,
        deviceId: "",
      }),
    ]).then(() => {
      clientA = Client(SERVER_URL);

      clientA.on("connect", () => {
        clientA.emit("join", senderPhoneNumber);

        clientA.emit("send_private_message", {
          recipientPhoneNumber,
          senderPhoneNumber,
          message,
          timestamp,
        });

        setTimeout(async () => {
          const senderId = await findByPhoneNumber(senderPhoneNumber);
          const receiverId = await findByPhoneNumber(recipientPhoneNumber);
          const storedMessage = await Message.findOne({
            where: { senderId, receiverId },
          });

          expect(storedMessage).toBeTruthy();
          expect(storedMessage?.status).toBe("sent");

          done();
        }, 4000);
      });
    });
  }, 20000);

  test("should store message with status 'sent' when recipient is blocked", (done) => {
    const senderPhoneNumber = "+919440058816";
    const recipientPhoneNumber = "+919440058818";
    const message = "Blocked message test";
    const timestamp = Date.now();

    User.create({
      phoneNumber: senderPhoneNumber,
      firstName: "Sender",
      lastName: "User",
      email: "sender2@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    });

    User.create({
      phoneNumber: recipientPhoneNumber,
      firstName: "Recipient",
      lastName: "User",
      email: "recipient2@gmail.com",
      password: "Test@123",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: null,
      isLogin: false,
      deviceId: "",
    });

    clientA = Client(SERVER_URL);

    clientA.on("connect", () => {
      clientA.emit("join", senderPhoneNumber);

      clientA.emit("send_private_message", {
        recipientPhoneNumber,
        senderPhoneNumber,
        message,
        timestamp,
      });

      setTimeout(async () => {
        const senderId = await findByPhoneNumber(senderPhoneNumber);
        const receiverId = await findByPhoneNumber(recipientPhoneNumber);
        const storedMessage = await Message.findOne({
          where: { senderId, receiverId },
        });

        expect(storedMessage).toBeTruthy();
        expect(storedMessage?.status).toBe("sent");

        done();
      }, 3000);
    });
  }, 20000);

  test("should ignore unknown event gracefully", (done) => {
    clientA = Client(SERVER_URL);
    clientA.on("connect", () => {
      clientA.emit("unknown_event", { data: "some data" });

      setTimeout(() => {
        expect(clientA.connected).toBeTruthy();
        done();
      }, 1000);
    });
  }, 5000);

  test("should handle disconnect when user is not found in database", (done) => {
    clientA = Client(SERVER_URL, {
      query: { socketId: "non-existent-socket-id" },
    });

    clientA.on("connect", () => {
      clientA.disconnect();

      setTimeout(async () => {
        const user = await User.findOne({
          where: { socketId: "non-existent-socket-id" },
        });
        expect(user).toBeNull();
        done();
      }, 1000);
    });
  }, 10000);
});
