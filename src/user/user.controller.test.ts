import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { validateEmail } from "./user.middleware";
import { User } from "./user.model";
describe("User controller Registration", () => {
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
    await User.truncate();
    await testInstance?.close();
  });
  test("Should return error message when the required fields are missing", async () => {
    const newResource = {
      firstName: "Test Resource",
      lastName: "A test resource",
      password: "Anu@1234",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(400);
  });
  test("should return the error when the profile picture data is invalid", async () => {
    const newResource = {
      firstName: "Test Resource",
      lastName: "A test resource",
      password: "Anu@1234",
      profilePicture: "somePicture",
      phoneNumber: "8522041688",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(500);
  });
  test("Should return the error message when the password is not in the valid form", async () => {
    const newResource = {
      phoneNumber: "2345678932",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "anu@1234",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(406);
  });
  test("should return bad request when the invalid email is given", async () => {
    const newResource = {
      phoneNumber: "2345678932",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "anu@1234",
      email: "anu@du",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(400);
  });
  test("should return un authorised message whenever the phone number is invalid", async () => {
    const newResource = {
      phoneNumber: "234567893",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "anu@1234",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(401);
  });
  test("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "2345678934",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anusha@gmail.com",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });
  test("should return user already existed with this number when the phone number is already registered", async () => {
    const newResource2 = {
      phoneNumber: "2345678934",
      firstName: "Test Resource3",
      lastName: "A test resource3",
      password: "Anu@12345",
    };
    const response2 = await request(app)
      .post("/api/users")
      .send(newResource2)
      .expect(409);
  });
  test("should return secret_key missing error when the secret_key is missing", async () => {
    delete process.env.JSON_WEB_SECRET;
    const newResource2 = {
      phoneNumber: "2345678974",
      firstName: "Test Resource3",
      lastName: "A test resource3",
      password: "Anu@12345",
    };
    const response2 = await request(app)
      .post("/api/users")
      .send(newResource2)
      .expect(412);
  });
  test("validate email should return the true when the email is valid", async () => {
    const newResource = {
      phoneNumber: "2345678934",
      firstName: "Anoosha",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anushauppu@gmail.com",
    };
    const response = validateEmail(newResource.email);
    expect(response).toBe(true);
  }, 5000);
  test("should return the error when the error occurs", async () => {
    const newResource = {
      phoneNumber: "9345678934",
      firstName: "Anoosha",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anusha@gmail.com",
    };
    const response2 = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(500);
    expect(response2.error).toBeTruthy();
  });
});

describe("User controller Login", () => {
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
    await User.truncate();
    await testInstance?.close();
  });
  test("Should return error message when the required fields are missing in while user login", async () => {
    const existingResource = {
      phoneNumber: "1431431432",
    };
    const response = await request(app)
      .post("/api/user")
      .send(existingResource)
      .expect(400);
  });
  test("Should return error message when the phone number is not with 10 digits", async () => {
    const existingResource = {
      phoneNumber: "143143143",
      password: "testuser@1234",
    };
    const response = await request(app)
      .post("/api/user")
      .send(existingResource)
      .expect(401);
  });
  test("should return un authorised message whenever the phone number is invalid in login", async () => {
    const resource = {
      phoneNumber: "2345678930",
      password: "testuser@1234",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(404);
  });
  test("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "2345678934",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anusha@gmail.com",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });
  test("should return the access token and refresh token when the user is fetched successfully", async () => {
    const resource = {
      phoneNumber: "2345678934",
      password: "Anu@1234",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });
  test("Should return error, when password doesn't match", async () => {
    const resource = {
      phoneNumber: "2345678934",
      password: "Anu@123",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(401);
  });

  test("should return secret_key missing error when the secret_key is missing", async () => {
    delete process.env.JSON_WEB_SECRET;
    const resource = {
      phoneNumber: "2345678934",
      password: "Anu@1234",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(412);
  });
});
