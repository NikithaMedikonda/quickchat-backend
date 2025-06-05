import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { createUser } from "../user/user.controller";
import { User } from "../user/user.model";
import { UserRestriction } from "./userRestriction.model";
import {
  addBlockedUserEntry,
  removeBlockedUserEntry,
} from "./userRestriction.service";

describe("Blocked Users Controller", () => {
  let testInstance: Sequelize;
  let accessToken: string;

  const blockerPhoneNumber = "+911111111111";
  const blockedPhoneNumber = "+922222222222";

  beforeAll(async () => {
    testInstance = SequelizeConnection();
    const blocker = await createUser({
      phoneNumber: blockerPhoneNumber,
      firstName: "Blocker",
      lastName: "User",
      email: "blocker@example.com",
      password: "Blocker@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin: false,
      deviceId: "qwertyuiop",
      fcmToken:'wghasfhgvhgvghjs'
    });

    await createUser({
      phoneNumber: blockedPhoneNumber,
      firstName: "Blocked",
      lastName: "User",
      email: "blocked@example.com",
      password: "Blocked@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin: false,
      deviceId: "kjhadjsghjs",
      fcmToken:'gfdtasfufuyfdwuydsafgiy'
    });

    const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
    accessToken = jwt.sign({ phoneNumber: blocker.phoneNumber }, secret_key, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    await UserRestriction.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await testInstance.close();
  });

  test("Should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/block/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ blockerPhoneNumber });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Please provide all the necessary fields.");
  });

  test("Should not allow user to block themselves", async () => {
    const res = await request(app)
      .post("/api/block/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockerPhoneNumber,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("You cannot block yourself.");
  });

  test("Should return 500 if any user is not found", async () => {
    const res = await request(app)
      .post("/api/block/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: "+999999999999",
      });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe(
      "Error while fetching the user User not found with the phone number"
    );
  });

  test("Should successfully block the user", async () => {
    const res = await request(app)
      .post("/api/block/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockedPhoneNumber,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User blocked successfully.");
    expect(res.body.blockedUsersDetails.blocker).toBeDefined();
    expect(res.body.blockedUsersDetails.blocked).toBeDefined();
  });

  test("Should return 409 if already blocked", async () => {
    const res = await request(app)
      .post("/api/block/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockedPhoneNumber,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("You have already blocked this user.");
  });

  test("should throw error if invalid blockerId and blockedId are sent ", async () => {
    await expect(addBlockedUserEntry("blockerId", "blockedId")).rejects.toThrow(
      `Error occurred while blocking user : invalid input syntax for type uuid: "blockerId"`
    );
  });

  describe("Unblock Users Controller", () => {
    test("Should return 400 if required fields are missing", async () => {
      const res = await request(app)
        .post("/api/unblock/users")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({ blockerPhoneNumber });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Please provide all the necessary fields.");
    });

    test("Should not allow user to unblock themselves", async () => {
      const res = await request(app)
        .post("/api/unblock/users")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({
          blockerPhoneNumber: blockerPhoneNumber,
          blockedPhoneNumber: blockerPhoneNumber,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("You cannot unblock yourself.");
    });

    test("Should return 404 if the user is not blocked", async () => {
      const newNumber = "+933333333333";

      await createUser({
        phoneNumber: newNumber,
        firstName: "Random",
        lastName: "User",
        email: "random@example.com",
        password: "Random@1234",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: "",
        isLogin: false,
        deviceId: "ajhdsjhgahsjHGFGS",
        fcmToken:'sghqwfhagdfhgfd'
      });

      const res = await request(app)
        .post("/api/unblock/users")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({
          blockerPhoneNumber: blockerPhoneNumber,
          blockedPhoneNumber: newNumber,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("This user is not blocked.");
    });

    test("Should successfully unblock the user", async () => {
      const res = await request(app)
        .post("/api/unblock/users")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({
          blockerPhoneNumber: blockerPhoneNumber,
          blockedPhoneNumber: blockedPhoneNumber,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("User unblocked successfully.");
      expect(res.body.unblockedUsersDetails.blocker).toBeDefined();
      expect(res.body.unblockedUsersDetails.blocked).toBeDefined();
    });

    test("Should return 404 if trying to unblock the user again", async () => {
      const res = await request(app)
        .post("/api/unblock/users")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({
          blockerPhoneNumber: blockerPhoneNumber,
          blockedPhoneNumber: blockedPhoneNumber,
        });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("This user is not blocked.");
    });

    test("Should return 500 if any user is not found", async () => {
      const res = await request(app)
        .post("/api/unblock/users")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send({
          blockerPhoneNumber: blockerPhoneNumber,
          blockedPhoneNumber: "+999999999999",
        });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe(
        "Error while fetching the user User not found with the phone number"
      );
    });

    test("should throw error if invalid blockerId and blockedId are sent ", async () => {
      await expect(
        removeBlockedUserEntry("blockerId", "blockedId")
      ).rejects.toThrow(
        `Error occurred while unblocking user: invalid input syntax for type uuid: "blockerId"`
      );
    });

    test("should throw error if blocked entry not found", async () => {
      const user1 = await createUser({
        phoneNumber: "+944444444444",
        firstName: "Unblock",
        lastName: "Tester1",
        email: "unblock1@example.com",
        password: "Test@1234",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: "",
        isLogin: false,
        deviceId: "GGGFWTE",
        fcmToken:'fqghsfdfyfdiysfdyifeai'
      });

      const user2 = await createUser({
        phoneNumber: "+955555555555",
        firstName: "Unblock",
        lastName: "Tester2",
        email: "unblock2@example.com",
        password: "Test@1234",
        isDeleted: false,
        publicKey: "",
        privateKey: "",
        socketId: "",
        isLogin: false,
        deviceId: "hgdfshcgfsjhv",
        fcmToken:'gsfadhfdfjqgwsd'
      });

      await expect(removeBlockedUserEntry(user1.id, user2.id)).rejects.toThrow(
        "Blocked entry not found."
      );
    });
  });
});

describe("Tests for checking blocked status functionality", () => {
  let testInstance: Sequelize;
  let accessToken: string;

  const blockerPhoneNumber = "+916303961097";
  const blockedPhoneNumber = "+916303974914";

  beforeAll(async () => {
    testInstance = SequelizeConnection();
    const blocker = await createUser({
      phoneNumber: blockerPhoneNumber,
      firstName: "Usha",
      lastName: "Sri",
      email: "uski@gmail.com",
      password: "blockeR@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin: false,
      deviceId: "qwertyuiop",
      fcmToken:'hvqhgsavdhgvhj'
    });

    await createUser({
      phoneNumber: blockedPhoneNumber,
      firstName: "Mamatha",
      lastName: "Niyal",
      email: "mammu@gmail.com",
      password: "blockeD@1234",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin: false,
      deviceId: "jhahgdjg",
      fcmToken:'ggvahgsvdhjv'
    });

    const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
    accessToken = jwt.sign({ phoneNumber: blocker.phoneNumber }, secret_key, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    await UserRestriction.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await testInstance.close();
  });

  test("Should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/users/block-status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ blockerPhoneNumber });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Please provide the necessary details.");
  });

  test("Should block a user i.e., create an entry in userRestriction table", async () => {
    const res = await request(app)
      .post("/api/block/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockedPhoneNumber,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User blocked successfully.");
    expect(res.body.blockedUsersDetails.blocker).toBeDefined();
    expect(res.body.blockedUsersDetails.blocked).toBeDefined();
  });

  test("Should return true, if user is blocked", async () => {
    const response = await request(app)
      .post("/api/users/block-status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockedPhoneNumber,
      })
      .expect(200);
    expect(response.body.isBlocked).toBe(true);
  });

  test("Should successfully unblock the user", async () => {
    const response = await request(app)
      .post("/api/unblock/users")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockedPhoneNumber,
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("User unblocked successfully.");
    expect(response.body.unblockedUsersDetails.blocker).toBeDefined();
    expect(response.body.unblockedUsersDetails.blocked).toBeDefined();
  });

  test("Should return false, if user is not blocked", async () => {
    const response = await request(app)
      .post("/api/users/block-status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: blockedPhoneNumber,
      })
      .expect(200);
    expect(response.body.isBlocked).toBe(false);
  });

  test("Should return 500 if any user is not found", async () => {
    const response = await request(app)
      .post("/api/users/block-status")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        blockerPhoneNumber: blockerPhoneNumber,
        blockedPhoneNumber: "+999999999999",
      });

    expect(response.status).toBe(500);
    expect(response.body.error).toContain(
      "User not found with the phone number"
    );
  });
});
