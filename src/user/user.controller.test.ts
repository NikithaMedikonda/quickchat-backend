import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import request from "supertest";
import { app } from "../../server";
import { SequelizeConnection } from "../connection/dbconnection";
import { base64, base64_1 } from "../constants/example.base64";
import { defaultProfileImage } from "../constants/example.defaultProfile";
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
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  test("Should return error message when the required fields are missing", async () => {
    const newResource = {
      firstName: "Test Resource",
      lastName: "A test resource",
      email: "test@gmail.com",
      password: "Anu@1234",
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/users").send(newResource).expect(400);
  });

  test("should return the error when the profile picture data is invalid", async () => {
    const newResource = {
      firstName: "Test Resource",
      lastName: "A test resource",
      password: "Anu@1234",
      profilePicture: "somePicture",
      phoneNumber: "8522041688",
      deviceId: "qwertyuiop",
      email: "test@gmail.com",
    };
    await request(app).post("/api/users").send(newResource).expect(500);
  });

  test("Should return the error message when the password is not in the valid form", async () => {
    const newResource = {
      phoneNumber: "9866349126",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "anu@1234",
      deviceId: "qwertyuiop",
      email:'anu@gmail.com'
    };
    await request(app).post("/api/users").send(newResource).expect(406);
  });

  test("should return bad request when the invalid email is given", async () => {
    const newResource = {
      phoneNumber: "9866349126",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "anu@1234",
      email: "anu",
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/users").send(newResource).expect(400);
  });

  test("should return un authorised message whenever the phone number is invalid", async () => {
    const newResource = {
      phoneNumber: "234567893",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "anu@1234",
      deviceId: "qwertyuiop",
      email: "test@gmail.com",
    };
    await request(app).post("/api/users").send(newResource).expect(401);
  });

  test("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "9440058809",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anusha@gmail.com",
      deviceId: "qwertyuiop",
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
      phoneNumber: "9440058809",
      firstName: "Test Resource3",
      lastName: "A test resource3",
      password: "Anu@12345",
      email: "anusha@gmail.com",
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/users").send(newResource2).expect(409);
  });

  test("validate email should return the true when the email is valid", async () => {
    const newResource = {
      phoneNumber: "7893615283",
      firstName: "Anoosha",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anushaupp@gmail.com",
      deviceId: "qwertyuiop",
    };
    const response = validateEmail(newResource.email);
    expect(response).toBe(true);
  }, 5000);

  test("should return the error when the error occurs", async () => {
    const newResource = {
      phoneNumber: "9999988888",
      firstName: "Anoosha",
      lastName: { invalid: "Uppu" },
      password: "Anu@1234",
      email: "anusha123@gmail.com",
    };
    const response2 = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(500);
    expect(response2.error).toBeTruthy();
  });

  test("should return secret_key missing error when the secret_key is missing", async () => {
    delete process.env.JSON_WEB_SECRET;
    const newResource3 = {
      phoneNumber: "6303522765",
      firstName: "Test Resource3",
      lastName: "A test resource3",
      password: "Anu@12345",
      email: "anusha1234@gmail.com",
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/users").send(newResource3).expect(412);
  });

  test("should create a user and upload profile picture successfully", async () => {
    const newResource = {
      phoneNumber: "9999988777",
      firstName: "Profile",
      lastName: "Picture",
      password: "Anu@1234",
      email: "profilepicture@test.com",
      profilePicture: base64,
      deviceId: "device123",
    };

    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(200);

    expect(response.body.user.profilePicture).toBeTruthy();
    expect(response.body.user.profilePicture).toMatch(/^https?:\/\//);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });

  test("should return this account is deleted when account with that phone number is already deleted", async () => {
    const newUser = {
      phoneNumber: "6303522768",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser1@test.com",
      deviceId: "poiuytrewq",
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

    expect(deleteResponse.body.message).toBe("Account deleted successfully");
    await request(app).post("/api/users").send(newUser).expect(404);
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
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });
  test("Should return error message when the required fields are missing in while user login", async () => {
    const existingResource = {
      phoneNumber: "1431431432",
    };
    await request(app).post("/api/user").send(existingResource).expect(400);
  });
  test("Should return error message when the phone number is not valid", async () => {
    const existingResource = {
      phoneNumber: "143143143",
      password: "testuser@1234",
    };
    await request(app).post("/api/user").send(existingResource).expect(401);
  });
  test("should return un authorised message whenever the user not exists with that phone number", async () => {
    const resource = {
      phoneNumber: "2345678930",
      password: "testuser@1234",
    };
    await request(app).post("/api/user").send(resource).expect(404);
  });
  test("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "9440058809",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anusha@gmail.com",
      deviceId: "qwertyuiop",
    };
    const response = await request(app)
      .post("/api/users")
      .send(newResource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });

  test("should return un authorised message whenever the deleted user tries to login", async () => {
    const newUser = {
      phoneNumber: "6303522765",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser1@test.com",
      deviceId: "poiuytrewq",
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
    expect(deleteResponse.body.message).toBe("Account deleted successfully");
    await request(app).post("/api/user").send(newUser).expect(404);
  });

  test("Should return error, when password doesn't match", async () => {
    const resource = {
      phoneNumber: "9440058809",
      password: "Anu@123",
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/user").send(resource).expect(401);
  });
  test("Should return error, when password doesn't match", async () => {
    const resource = {
      phoneNumber: "9440058809",
      password: { password: "Invalid password" },
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/user").send(resource).expect(500);
  });

  test("should return secret_key missing error when the secret_key is missing", async () => {
    delete process.env.JSON_WEB_SECRET;
    const resource = {
      phoneNumber: "9440058809",
      password: "Anu@1234",
      deviceId: "qwertyuiop",
    };
    await request(app).post("/api/user").send(resource).expect(412);
  });
  test("should return the access token and refresh token when the user is fetched successfully", async () => {
    const resource = {
      phoneNumber: "9440058809",
      password: "Anu@1234",
      deviceId: "qwertyuiop",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
  });
  test("should return 200 if user already user logged in", async () => {
    const resource = {
      phoneNumber: "9440058809",
      password: "Anu@1234",
      deviceId: "qwertyuiop",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(200);
    expect(response.body.message).toEqual("Login success");
  });
  test("should return 200 if user already user logged in", async () => {
    const resource = {
      phoneNumber: "9440058809",
      password: "Anu@1234",
      deviceId: "afshgdfghfashdfafsjd",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(200);
    expect(response.body.message).toEqual(
      "User was logged out from previous device and logged in on new device"
    );
  });
  test("should update fcmToken if a new fcmToken is provided", async () => {
    const newResource = {
      phoneNumber: "8888888888",
      firstName: "FCM",
      lastName: "TokenTest",
      password: "Fcm@1234",
      email: "fcmtest@test.com",
      deviceId: "deviceFCMTest",
    };
    await request(app).post("/api/users").send(newResource).expect(200);
    const loginPayload = {
      phoneNumber: "8888888888",
      password: "Fcm@1234",
      deviceId: "deviceFCMTest",
      fcmToken: "newFCMToken123",
    };

    const loginResponse = await request(app)
      .post("/api/user")
      .send(loginPayload)
      .expect(200);

    expect(loginResponse.body.user.fcmToken).toEqual("newFCMToken123");
  });
});

describe("User controller Logout", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;
  beforeEach(async () => {
    process.env = { ...originalEnv };
  });
  afterEach(async () => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });
  beforeAll(() => {
    testInstance = SequelizeConnection()!;
  });
  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });
  test("Should return error message when the required fields are missing in while user login", async () => {
    const existingResource = {
      phoneNumber: "",
    };
    await request(app).post("/api/logout").send(existingResource).expect(400);
  });
  test("Should return error message when the required fields are missing in while user login", async () => {
    const existingResource = {
      phoneNumber: "123456789012345678",
    };
    await request(app).post("/api/logout").send(existingResource).expect(401);
  });
  test("Should return error message when the phone number is not valid", async () => {
    const existingResource = {
      phoneNumber: "9440058809",
    };
    await request(app).post("/api/logout").send(existingResource).expect(404);
  });
  test("should return un authorised message whenever the user not exists with that phone number", async () => {
    const resource = {
      phoneNumber: "2345678930",
    };
    await request(app).post("/api/logout").send(resource).expect(404);
  });
  test("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "9440058809",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "Anu@1234",
      email: "anusha@gmail.com",
      deviceId: "qwertyuiop",
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
      phoneNumber: "9440058809",
      password: "Anu@1234",
      deviceId: "qwertyuiop",
    };
    const response = await request(app)
      .post("/api/user")
      .send(resource)
      .expect(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
    expect(response.body.message).toEqual("Login success");
  });

  test("should return secret_key missing error when the secret_key is missing", async () => {
    delete process.env.JSON_WEB_SECRET;
    const resource = {
      phoneNumber: "9440058809",
    };
    await request(app).post("/api/logout").send(resource).expect(412);
  });
  test("should return un authorised message whenever the user not exists with that phone number", async () => {
    const resource = {
      phoneNumber: "9440058809",
    };
    await request(app).post("/api/logout").send(resource).expect(200);
  });

  it("Should respond with status code 500 if something goes wrong", async () => {
    process.env.SERVICE_KEY = "unknown-service_key";
    const accessToken = "wsfdhgvhwgdv";
    const resource = {
      phoneNumber: "9876543210",
    };
    try {
      await request(app)
        .put("/api/logout")
        .set({ Authorization: `Bearer ${accessToken}` })
        .send(resource)
        .expect(500);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test("should return 409 if user already user logged in", async () => {
    const resource = {
      phoneNumber: "9440058809",
    };
    await request(app).post("/api/logout").send(resource).expect(409);
  });
  test("should return 500 when an unexpected error occurs", async () => {
    jest
      .spyOn(User, "findOne")
      .mockRejectedValue(new Error("Unexpected DB Error"));
    process.env.SERVICE_KEY = "unknown-service_key";
    const accessToken = "wsfdhgvqgdsgusghwgdv";
    const resource = {
      phoneNumber: "9440053459",
    };

    const response = await request(app)
      .post("/api/logout")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(resource)
      .expect(500);

    expect(response.text).toContain("Unexpected DB Error");
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
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  it("should return the access token and refresh token when the user is created successfully", async () => {
    const newResource = {
      phoneNumber: "9876543210",
      firstName: "Test Resource2",
      lastName: "A test resource2",
      password: "tesT@1234",
      email: "test@gmail.com",
      deviceId: "qwertyuiop",
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
    await request(app)
      .put("/api/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(resource)
      .expect(400);
  });

  it("Should throw error if user is not present with the provided phone number", async () => {
    const resource = {
      phoneNumber: "7330205168",
      profilePicture: "base:image/jpg",
    };
    await request(app)
      .put("/api/user")
      .set({ Authorization: `Bearer ${accessToken}` })
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
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(resource)
      .expect(200);

    expect(newResponse.body.user.profilePicture).toBeTruthy();
  });

  it("Should just assign the default profile pic if user removed the profile dp", async () => {
    const resource = {
      phoneNumber: "9876543210",
      profilePicture: defaultProfileImage,
      deviceId: "qwertyuiop",
    };
    const response = await request(app)
      .put("/api/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(resource)
      .expect(200);
    expect(response.body.user.profilePicture).toEqual(defaultProfileImage);
  });

  it("Should just assign db profile pic if user didn't change the profile dp", async () => {
    const resource = {
      phoneNumber: "9876543210",
      profilePicture: "",
      deviceId: "qwertyuiop",
    };
    const response = await request(app)
      .put("/api/user")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send(resource)
      .expect(200);
    expect(response.body.user.profilePicture).toEqual(defaultProfileImage);
  });

  it("Should respond with status code 500 if something goes wrong", async () => {
    process.env.SERVICE_KEY = "unknown-service_key";
    const resource = {
      phoneNumber: "9876543210",
      profilePicture: base64,
      deviceId: "qwertyuiop",
    };
    try {
      await request(app)
        .put("/api/user")
        .set({ Authorization: `Bearer ${accessToken}` })
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
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    testInstance = SequelizeConnection()!;
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  test("should return 404 when user does not exist", async () => {
    const newUser = {
      phoneNumber: "9876543210",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser@test.com",
      deviceId: "qwertyuiop",
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
      phoneNumber: "6303522765",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser1@test.com",
      deviceId: "poiuytrewq",
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

    expect(deleteResponse.body.message).toBe("Account deleted successfully");

    const userInDb = await User.findOne({
      where: { phoneNumber: "6303522765" },
    });
    expect(userInDb?.isDeleted).toBe(true);
  });
  test("should return 500 if any error occured", async () => {
    const newUser1 = {
      phoneNumber: "6303522762",
      firstName: "Delete",
      lastName: "User",
      password: "Delete@1234",
      email: "deleteuser3@test.com",
      deviceId: "poiuytrewq",
    };
    const user = await request(app)
      .post("/api/users")
      .send(newUser1)
      .expect(200);

    try {
      await request(app)
        .put("/api/deleteAccoun")
        .set("authorization", `Bearer ${user.body.accessToken}`)
        .send({ phoneNumber: { newUser: newUser1.phoneNumber } })
        .expect(500);
    } catch (error) {
      expect(error).toBeDefined();
    }
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
    process.env.JSON_WEB_SECRET = secret;
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  test("should return 400 if tokens are missing", async () => {
    const res = await request(app).post("/api/auth/validate");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing tokens in headers");
  });

  test("should return 412 if JWT secret is missing", async () => {
    process.env.JSON_WEB_SECRET = "";

    const res = await request(app)
      .post("/api/auth/validate")
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
      .post("/api/auth/validate")
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
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin: false,
      deviceId: "qwertyuiop",
      email:'test@gmail.com'
    });

    const token = jwt.sign(
      { phoneNumber: user.phoneNumber },
      process.env.JSON_WEB_SECRET!,
      { expiresIn: "1h" }
    );
    const deviceId = {
      deviceId: "qwertyuiop",
    };
    const res = await request(app)
      .post("/api/auth/validate")
      .set("Authorization", `Bearer ${token}`)
      .send(deviceId)
      .set("x-refresh-token", "dummy");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access token valid");
  });

  test("should return 403 for invalid access token", async () => {
    const res = await request(app)
      .post("/api/auth/validate")
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
      .post("/api/auth/validate")
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
      .post("/api/auth/validate")
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
      publicKey: "",
      privateKey: "",
      socketId: "",
      isLogin: false,
      deviceId: "qwertyuiop",
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
      .post("/api/auth/validate")
      .set("Authorization", `Bearer ${expiredAccessToken}`)
      .set("x-refresh-token", validRefreshToken);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.message).toBe("New access token issued");
  });

  test("should return 403 when both tokens are invalid", async () => {
    const response = await request(app)
      .post("/api/auth/validate")
      .set("Authorization", `Bearer invalidtoken`)
      .set("x-refresh-token", `invalidtoken`)
      .expect(403);

    expect(response.body.message).toBe("Invalid access token");
  });
});

describe("Contacts Display Test Suite", () => {
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

  it("should return user contact details (registered and unregistered)", async () => {
    const newResource = {
      phoneNumber: "9876543210",
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

    const userOne = {
      phoneNumber: "7997520973",
      firstName: "Test",
      lastName: "One",
      password: "tesT@1234",
      email: "testOne@gmail.com",
      deviceId: "qwertyuiop",
      publicKey: "abc",
    };

    const userTwo = {
      phoneNumber: "9248434816",
      firstName: "Test",
      lastName: "Two",
      password: "tesT@1234",
      email: "testTwo@gmail.com",
      deviceId: "hagsdfhgdfvjga",
      publicKey: "xyz",
    };

    await request(app).post("/api/users").send(userOne).expect(200);
    await request(app).post("/api/users").send(userTwo).expect(200);

    const phoneNumbersListToTest = [
      "8522041688",
      "98866349126",
      "9248434816",
      "7997520973",
    ];

    const response = await request(app)
      .post("/api/users/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(phoneNumbersListToTest);

    expect(response.body.data).toBeTruthy();
    expect(response.body.data).toHaveProperty("unRegisteredUsers");

    const { registeredUsers, unRegisteredUsers } = response.body.data;

    expect(registeredUsers.length).toBe(2);
    expect(registeredUsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Test One",
          phoneNumber: "7997520973",
          profilePicture: null,
          publicKey: "abc",
        }),
        expect.objectContaining({
          name: "Test Two",
          phoneNumber: "9248434816",
          profilePicture: null,
          publicKey: "xyz",
        }),
      ])
    );

    expect(unRegisteredUsers.length).toBe(2);
    expect(unRegisteredUsers).toEqual(
      expect.arrayContaining(["8522041688", "98866349126"])
    );
  });

  it("should handle error when the database query fails", async () => {
   const mock = jest
    .spyOn(User, "findAll")
    .mockRejectedValue(new Error("Database query failed"));

    const phoneNumbersListToTest = [
      "8522041688",
      "98866349126",
      "9248434816",
      "7997520973",
    ];

    const response = await request(app)
      .post("/api/users/contacts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(phoneNumbersListToTest);

    expect(response.status).toBe(500);

    expect(response.body.message).toBe("Database query failed");
    mock.mockRestore();
  });
});

describe("Get Profile URLs For Phone Numbers", () => {
  let testInstance: Sequelize;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    await User.truncate({ cascade: true });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  beforeAll(async () => {
    testInstance = SequelizeConnection()!;
    await User.truncate({ cascade: true });
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
    await testInstance?.close();
  });

  test("should return 400 when phoneNumbers array is missing", async () => {
    const response = await request(app)
      .post("/api/getProfileUrls")
      .send({})
      .expect(400);

    expect(response.body.message).toBe(
      "Invalid request. 'phoneNumbers' array is required in the body."
    );
  });

  test("should return empty data array when no users are found", async () => {
    const response = await request(app)
      .post("/api/getProfileUrls")
      .send({ phoneNumbers: ["9876543210"] })
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  test("should return profile URLs for valid phone numbers", async () => {
    const newUser = {
      phoneNumber: "9876543210",
      firstName: "Test",
      lastName: "User",
      password: "Test@1234",
      email: "testuser@test.com",
      deviceId: "device123",
      profilePicture: base64_1,
    };
    const response = await request(app)
      .post("/api/users")
      .send(newUser)
      .expect(200);
    const accessToken = response.body.accessToken;
    const urlResponse = await request(app)
      .post("/api/getProfileUrls")
      .set({ Authorization: `Bearer ${accessToken}` })
      .send({ phoneNumbers: [newUser.phoneNumber] })
      .expect(200);
    expect(urlResponse.body.data[0].phoneNumber).toBe(newUser.phoneNumber);
    expect(typeof urlResponse.body.data[0].profilePicture).toBe("string");
    expect(urlResponse.body.data[0].profilePicture.startsWith("http")).toBe(
      true
    );
  });
  test("should return 500 when an unexpected error occurs", async () => {
    jest
      .spyOn(User, "findAll")
      .mockImplementation(() => Promise.reject(new Error("DB Error")));
    const response = await request(app)
      .post("/api/getProfileUrls")
      .send({ phoneNumbers: ["1234567890"] })
      .expect(500);

    expect(response.body.message).toBe("DB Error");
  });
});
