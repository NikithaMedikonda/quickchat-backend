import request from "supertest";
import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { User } from "../user/user.model";
import { BlockedUsers } from "./blocked-users.model";
import { createUser } from "../user/user.controller";
import { addBlockedUserEntry } from "./blocked-users.service";

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
    });

    const secret_key = process.env.JSON_WEB_SECRET || "quick_chat_secret";
    accessToken = jwt.sign({ phoneNumber: blocker.phoneNumber }, secret_key, {
      expiresIn: "7d",
    });
  });

  afterAll(async () => {
    await BlockedUsers.truncate({ cascade: true });
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
      `Error occurred while blocking user : invalid input syntax for type uuid: \"blockerId\"`
    );
  });
});
