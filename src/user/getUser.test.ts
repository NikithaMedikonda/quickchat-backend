import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { User } from "./user.model";

describe("Get User details by phone number", () => {
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
    testInstance = SequelizeConnection()!;
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  it("should return user details by phone number", async () => {
    const newResource = {
      phoneNumber: "9898989898",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "tesT@1234",
      email: "test@gmail.com",
      deviceId: "qwermnacbxhjgvtyuiop",
    };

    const responseLogin = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(200);

    expect(responseLogin.body.accessToken).toBeTruthy();
    accessToken = responseLogin.body.accessToken;
    expect(responseLogin.body.refreshToken).toBeTruthy();

    const userDetailsResponse = await request(app)
      .get("/api/user/9898989898")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const userDetails = userDetailsResponse.body;

    expect(userDetails).toBeDefined();
  });

  it("should return 404 if user with given phone number does not exist", async () => {
    const validUser = {
      phoneNumber: "9012345678",
      firstName: "Valid",
      lastName: "User",
      password: "Valid@1234",
      email: "valid@example.com",
      deviceId: "valid-device",
    };

    const res = await request(app)
      .post("/api/users")
      .send(validUser)
      .expect(200);

    const token = res.body.accessToken;

    const response = await request(app)
      .get("/api/user/0000000000")
      .set("Authorization", `Bearer ${token}`)
      .expect(404);

    expect(response.body).toEqual({ message: "User not found" });
  });
});
