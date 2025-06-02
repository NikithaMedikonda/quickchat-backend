import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { User } from "./user.model";

describe("Tests for getting a user deleted status", () => {
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

  it("should create user", async () => {
    const newUser = {
      phoneNumber: "+919440058822",
      firstName: "Ajnooshaaa",
      lastName: "Uhseraa",
      password: "Anhu@12343",
      email: "anuiu@gmail.com",
      socketId: "12281",
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      isLogin: false,
      deviceId: "zsdxfcgvhbjn",
    };
    const user = await request(app).post("/api/users").send(newUser);
    expect(user.status).toBe(200);
    accessToken = user.body.accessToken;
  });

  it("should return 400 when phoneNumber is not provided", async () => {
    const response = await request(app)
      .post("/api/users/deleted")
      .set("authorization", `Bearer ${accessToken}`)
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe(
      "Phone Number is required to get user deleted status"
    );
  });

  it("should return 400 when phoneNumber is empty string", async () => {
    const response = await request(app)
      .post("/api/users/deleted")
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        phoneNumber: "",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Phone Number is required to get user deleted status"
    );
  });

  it("should return 200 and user delete status", async () => {
    const response = await request(app)
      .post("/api/users/deleted")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        phoneNumber: "+919440058822",
      })
      .expect(200);
    // expect(response.body.data).toHaveProp erty("isDeleted");
    expect(response.body.isDeleted).toBe(false);
  });

  it("Should throw error if user is not present with the provided phone number", async () => {
    await request(app)
      .post("/api/users/deleted")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({
        phoneNumber: "733020518",
      })
      .expect(404);
  });

  it("should handle database errors gracefully", async () => {
    await testInstance.close();

    const response = await request(app)
      .post("/api/users/deleted")
      .set("authorization", `Bearer ${accessToken}`)
      .send({
        phoneNumber: { phoneNumber: "9876543210" },
      })
      .expect(500);

    expect(response.body).toHaveProperty("error");

    testInstance = SequelizeConnection()!;
  });
});