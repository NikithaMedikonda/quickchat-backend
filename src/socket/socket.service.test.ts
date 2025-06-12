import { Sequelize } from "sequelize";
import { SequelizeConnection } from "../connection/dbconnection";
import {
  disconnectUser,
  findUserSocketId,
  getBlockedSocketIds,
  storeMessage,
  updateUserSocketId,
} from "../socket/socket.service";
import { User } from "../user/user.model";
import { UserRestriction } from "../userRestriction/userRestriction.model";

describe("Tests for socket services", () => {
  let testInstance: Sequelize;
  let user: User;
  let id: string = "";
  beforeAll(async () => {
    testInstance = SequelizeConnection();
    const testUser = {
      phoneNumber: "+919440058809",
      firstName: "Anoosha",
      lastName: "Sanugula",
      email: "anoosha@gmail.com",
      password: "Anu@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "socket12",
      isLogin:false,
      deviceId:'qwertyuiop'
    };
    user = await User.create(testUser);
    id = user.id;
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance.close();
  });

  describe("Tests for function updateUserSocketId", () => {
    it("should update socketId for an existing user", async () => {
      const socketId = "socket123";
      await updateUserSocketId(user.phoneNumber, socketId);
      const updatedUser = await User.findOne({ where: { socketId } });
      expect(updatedUser).toBeDefined();
    });

    it("should return message for invalid phone number", async () => {
      const result = await updateUserSocketId("999999999", "socket123");
      expect(result).toEqual({ message: "Invalid phone number" });
    });
  });

  describe("Tests for function findUserSocketId", () => {
    it("should return socketId for an existing user", async () => {
      const socketId = "socket123";
      const result = await findUserSocketId(user.phoneNumber);
      expect(result).toBe(socketId);
    });

    it("should return null if user does not exist", async () => {
      const result = await findUserSocketId("99999999");
      expect(result).toBeNull();
    });
  });

  describe("Test for function storeMessage", () => {
    it("should store a new message", async () => {
      const message = "Hello!";
      const timestamp = new Date().toISOString();
      const recipient = await User.create({
        phoneNumber: "+919440058801",
        firstName: "Bingi",
        lastName: "S",
        email: "bingi@gmail.com",
        password: "Anu@1234",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: "socket1223",
        isLogin:false,
        deviceId:'qwertyuiop'
      });

      const result = await storeMessage({
        recipientPhoneNumber: recipient.phoneNumber,
        senderPhoneNumber: user.phoneNumber,
        message,
        timestamp,
        status:"sent"
      });

      expect(result.senderId).toBe(id);
      expect(result.receiverId).toBe(recipient.id);
      expect(result.content).toBe("Hello!");
    });
  });

  describe("Test for function disconnectUser", () => {
    it("should nullify socketId for an existing user", async () => {
      await disconnectUser("socket123");
      const updatedUser = await User.findOne({
        where: { phoneNumber: user.phoneNumber },
      });
      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.socketId).toBeNull();
    });

    it("should return message if user with socketId doesn't exist", async () => {
      const result = await disconnectUser("invalidSocketId");
      expect(result).toEqual({ message: "No user exist with this socket id" });
    });
  });
describe("Test for function getBlockedSocketIds", () => {
  beforeEach(async () => {
    await UserRestriction.truncate({ cascade: true });
  });
  it("should give the array of the socketIds that blocked by this user", async () => {
    const blockedUser = await User.create({
      phoneNumber: "+919440058802",
      firstName: "Blocked",
      lastName: "User",
      email: "blocked@gmail.com",
      password: "Anu@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "blockedSocket123",
      isLogin: false,
      deviceId: "blockedDevice"
    });
    await UserRestriction.create({
      blocker: user.id, 
      blocked: blockedUser.id,
    });

    const result = await getBlockedSocketIds(user.phoneNumber);

    expect(result).toContain("blockedSocket123");
  });

  it("should return an empty array if no blocked users", async () => {
    const result = await getBlockedSocketIds(user.phoneNumber);
    expect(result).toEqual([]);
  });
});
});
