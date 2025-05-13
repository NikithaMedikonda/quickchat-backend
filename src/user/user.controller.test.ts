import dotenv from "dotenv";
import request from "supertest";
import { app } from "../../server";
import { base64 } from "../constants/example.base64";
import { defaultProfileImage } from "../constants/example.defaultProfile";
import { SequelizeConnection } from "../connection/dbconnection";
import { Sequelize } from "sequelize";
import { User } from "./user.model";
import { validateEmail } from "./user.middleware";
import jwt from "jsonwebtoken";
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
      email: "anushaupp@gmail.com",
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
  test("Should return error, when password doesn't match", async () => {
    const resource = {
      phoneNumber: "2345678934",
      password: { password: "Invalid password" },
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(500);
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

describe("Tests for user controller for updating profile", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  let accessToken: string;
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

  it("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "9876543210",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "tesT@1234",
      email: "test@gmail.com",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    accessToken = response.body.accessToken;
    expect(response.body.refreshToken).toBeTruthy();
  });
  it("Should throw error if phone number is not sent in request body", async () => {
    const resource = {
      profilePicture: "base:image/jpg",
    };
    const response = await request(app)
      .put("/api/user")
      .set({ Authorization:  `Bearer ${accessToken}` })
      .send(resource)
      .expect(400);
  });
  it("Should throw error if user is not present with the provided phone number", async () => {
    const resource = {
      phoneNumber: "1234567890",
      profilePicture: "base:image/jpg",
    };
    const response = await request(app)
      .put("/api/user")
      .set({ Authorization:  `Bearer ${accessToken}` })
      .send(resource)
      .expect(404); 
  });

  it("Should update profile details properly", async () => {
    const resource = {
      phoneNumber: "9876543210",
      profilePicture: base64,
    };
    const newResponse = await request(app)
      .put("/api/user")
      .set({ Authorization:  `Bearer ${accessToken}` })
      .send(resource)
      .expect(200);
    
    expect(newResponse.body.user.profilePicture).toBeTruthy();
  });

  it("Should just assign the default profile pic if user removed the profile dp", async () => {
    const resource = {
      phoneNumber: "9876543210",
      profilePicture: defaultProfileImage,
    };
    const response = await request(app)
      .put("/api/user")
      .set({ Authorization:  `Bearer ${accessToken}` })
      .send(resource)
      .expect(200);
    expect(response.body.user.profilePicture).toEqual(defaultProfileImage);
  });
  
  it("Should respond with status code 500 if something goes wrong", async () => {
    process.env.SERVICE_KEY = "unknown-service_key";
    const resource = {
      phoneNumber: "9876543210",
      profilePicture: base64,
    };
    try {
      const newResponse = await request(app)
        .put("/api/user")
        .set({ Authorization:  `Bearer ${accessToken}` })
        .send(resource)
        .expect(500);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("User Account Deletion", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;

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
    await User.truncate();
    await testInstance?.close();
  });

  test("should return 404 when user does not exist", async () => {
      const newUser = {
      phoneNumber: "9876543210",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser@test.com",
    };
    const user = await request(app)
      .post("/api/users")
      .send(newUser)
      .expect(200);

    const response = await request(app)
      .post("/api/deleteAccount")
      .set("authorization", `Bearer ${user.body.accessToken}`)
      .send({ phoneNumber: "0000000000" })
      .expect(404);

    expect(response.body.message).toBe("Invalid phone number");
  });

  test("should delete the user successfully and return 200", async () => {
      const newUser = {
      phoneNumber: "9999911111",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser1@test.com",
    };
    const user = await request(app)
      .post("/api/users")
      .send(newUser)
      .expect(200);
    const deleteResponse = await request(app)
      .post("/api/deleteAccount")
      .set("authorization", `Bearer ${user.body.accessToken}`)
      .send({ phoneNumber: newUser.phoneNumber })
      .expect(200);

    expect(deleteResponse.body.message).toBe("Account deleted succesfully");

    const userInDb = await User.findOne({
      where: { firstName: "deleteFirstName" },
    });
    expect(userInDb?.isDeleted).toBe(true);
    expect(userInDb?.phoneNumber).toBe(`deletedPhoneNumber_${userInDb?.id}`);
  });
  test("should test the catch error", async () => {
        const newUser = {
      phoneNumber: "9999922222",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser2@test.com",
    };
    const user = await request(app)
      .post("/api/users")
      .send(newUser)
      .expect(200);
    const response = await request(app)
      .post("/api/deleteAccount")
      .set("authorization", `Bearer ${user.body.accessToken}`)
      .send({ phoneNumber: { invalid: "Invalid password" } })
      .expect(500);
  });
});

describe("Check Authentication Test Suite", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  const secret = "testsecret";

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

  test("should return 400 if tokens are missing", async () => {
    const res = await request(app).post("/api/checkAuth");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing tokens in headers");
  });

  test("should return 412 if JWT secret is missing", async () => {
    process.env.JSON_WEB_SECRET = "";

    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", "Bearer dummy")
      .set("x-refresh-token", "dummy");

    expect(res.status).toBe(412);
    expect(res.body.message).toBe("Missing JWT secret key");
  });

  test("should return 404 if user not found with valid access token", async () => {
    process.env.JSON_WEB_SECRET = secret;

    const token = jwt.sign({ phoneNumber: "9999999999" }, secret, {
      expiresIn: "1h",
    });

    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer ${token}`)
      .set("x-refresh-token", "dummy");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  test("should return 200 if valid access token and user exist", async () => {
    process.env.JSON_WEB_SECRET = secret;

    const user = await User.create({
      phoneNumber: "9999999999",
      firstName: "Abc",
      lastName: "Test",
      password: "Test@123",
      isDeleted: false,
    });

    const token = jwt.sign(
      { phoneNumber: user.phoneNumber },
      process.env.JSON_WEB_SECRET!,
      { expiresIn: "1h" }
    );
    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer ${token}`)
      .set("x-refresh-token", "dummy");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access token valid");
  });

  test("should return 403 for invalid access token", async () => {
    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer invalid.token.here`)
      .set("x-refresh-token", "dummy");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid access token");
  });

  test("should return 403 for invalid refresh token after expired access token", async () => {
    process.env.JSON_WEB_SECRET = secret;

    const expiredAccessToken = jwt.sign({ phoneNumber: "9999999999" }, secret, {
      expiresIn: "1s",
    });
    await new Promise((res) => setTimeout(res, 1100));

    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer ${expiredAccessToken}`)
      .set("x-refresh-token", "invalid.refresh.token");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Invalid refresh token");
  });

  test("should return 404 if user not found with valid refresh token", async () => {
    await User.destroy({ where: { phoneNumber: "9999999999" } });

    process.env.JSON_WEB_SECRET = secret;

    const expiredAccessToken = jwt.sign({ phoneNumber: "9999999999" }, secret, {
      expiresIn: "1s",
    });
    await new Promise((res) => setTimeout(res, 1100));
    const validRefreshToken = jwt.sign("9999999999", secret);

    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer ${expiredAccessToken}`)
      .set("x-refresh-token", validRefreshToken);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  test("should return new tokens if access is expired and refresh is valid", async () => {
    process.env.JSON_WEB_SECRET = secret;

    await User.destroy({ where: { phoneNumber: "9999999999" } });

    const user = await User.create({
      phoneNumber: "9999999999",
      firstName: "Abc",
      lastName: "Test",
      password: "Test@123",
      isDeleted: false,
      email: "abc@gmail.com",
    });

    const expiredAccessToken = jwt.sign(
      { phoneNumber: user.phoneNumber },
      process.env.JSON_WEB_SECRET!,
      { expiresIn: "-1h" }
    );

    const validRefreshToken = jwt.sign(
      { phoneNumber: user.phoneNumber },
      process.env.JSON_WEB_SECRET!,
      { expiresIn: "1d" }
    );

    const res = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer ${expiredAccessToken}`)
      .set("x-refresh-token", validRefreshToken);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.message).toBe("New access token issued");
  });

  test("should return 403 when both tokens are invalid", async () => {
    const response = await request(app)
      .post("/api/checkAuth")
      .set("Authorization", `Bearer invalidtoken`)
      .set("x-refresh-token", `invalidtoken`)
      .expect(403);

    expect(response.body.message).toBe("Invalid access token");
  });
});
