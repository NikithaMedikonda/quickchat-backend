import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { User } from "./user.model";

describe("Tests for getting a socketId of a user to check online status", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  let accessToken: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  beforeAll(async () => {
    testInstance = await SequelizeConnection()!;
    await User.sync({ force: true });
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  it("should create users", async () => {
    const newUser = {
      phoneNumber: "+919440058812",
      firstName: "Anooshaaa",
      lastName: "Useraa",
      password: "Anu@12343",
      email: "anuu@gmail.com",
      socketId: "1221",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      isLogin: false,
      deviceId: "",
    };
    const newUserTwo = {
      phoneNumber: "+918522041688",
      firstName: "Anusha",
      lastName: "Useraa",
      password: "Anu@12343",
      email: "anuuppu@gmail.com",
      socketId: "1222",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      isLogin: false,
      deviceId: "",
    };
    const user = await request(app).post("/api/users").send(newUser);
    const user2 = await request(app).post("/api/users").send(newUserTwo);
    expect(user.status).toBe(200);
    expect(user2.status).toBe(200);
    accessToken = user.body.accessToken;
  });

  it("should return 400 when phoneNumber is not provided", async () => {
    const response = await request(app)
      .post("/api/users/online")
      .set("authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe(
      "Phone Number is required to get socketId"
    );
  });

  it("should return 400 when phoneNumber is empty string", async () => {
    const response = await request(app)
      .post("/api/users/online")
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        phoneNumber: "",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Phone Number is required to get socketId"
    );
  });

  it("should return 200 and socketId when user exists", async () => {
    const response = await request(app)
      .post("/api/users/online")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        phoneNumber: "+919440058812",
        requestedUserPhoneNumber:'+918522041688'
      })
      .expect(200);
    expect(response.body.data).toHaveProperty("socketId");
    expect(response.body.data.socketId).toBe("1221");
  });

  it("Should throw error if user is not present with the provided phone number", async () => {
    await request(app)
      .post("/api/users/online")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        phoneNumber: "733020518",
        requestedUserPhoneNumber: "+918522041688",
      })
      .expect(404);
  });

  it("should handle database errors gracefully", async () => {
    await testInstance.close();

    const response = await request(app)
      .post("/api/users/online")
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        phoneNumber: { phoneNumber: "9876543210" },
      })
      .expect(500);

    expect(response.body).toHaveProperty("error");

    testInstance = SequelizeConnection()!;
  });
});
