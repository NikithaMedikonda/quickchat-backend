import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { authenticateToken } from "./user.middleware";

import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../../server";
import { User } from "./user.model";
dotenv.config({ path: ".env.test" });

describe("Authentication route", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSend: jest.Mock;
  let mockBody: jest.Mock;
  let mockNext: jest.Mock;
  const originalEnv = process.env;
  beforeEach(() => {
    mockSend = jest.fn();
    mockBody = jest.fn();
    mockNext = jest.fn();
    mockResponse = {
      sendStatus: jest.fn().mockReturnThis(),
      send: mockSend,
      json: mockBody.mockReturnThis(),
    };
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  it("should return error message when the token is missing ", async () => {
    mockRequest = { headers: {}, body: {} };
    process.env.JSON_WEB_SECRET = "quick_chat_secret";
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
  });

  it("should return 403 when the token is expired ", async () => {
    mockRequest = {
      headers: {
        authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.QW51c2hhX3VwcHU.ml4zVhE983COkKHbHmo0TpscL2RZcCGFknqHCkf2gQg",
      },
      body: {},
    };
    process.env.JSON_WEB_SECRET = "quick_chat_secret";
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(403);
  });
  it("should return error 412 when the web_secret_not found ", async () => {
    delete process.env.JSON_WEB_SECRET;
    mockRequest = {
      headers: {
        authorization:
          "Bearer eyJhbGciOiJIUzI1NiJ9.QW51c2hhX3VwcHU.ml4zVhE983COkKHbHmo0TpscL2RZcCGFknqHCkf2gQg",
      },
      body: {},
    };

    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(412);
  });
});

describe("Tests for validateAndCheck and verifyUserDetails", () => {
  const dummyUserData = {
    phoneNumber: "9999999999",
    email: "testuser@gmail.com",
    name: "Test User",
    password: "Secret123",
  };
  const dummyUserBData = {
    phoneNumber: "9999999998",
    email: "testuserA@gmail.com",
    name: "Test User",
    password: "Secret123",
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(dummyUserData.password, 10);
    await User.create({
      phoneNumber: dummyUserData.phoneNumber,
      email: dummyUserData.email,
      firstName: "Test",
      lastName: "User",
      password: hashedPassword,
      isLogin: true,
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      deviceId: "",
    });
    await User.create({
      phoneNumber: dummyUserBData.phoneNumber,
      email: dummyUserBData.email,
      firstName: "Test",
      lastName: "User",
      password: hashedPassword,
      isLogin: true,
      isDeleted: false,
      publicKey: "",
      privateKey: "",
      deviceId: "",
    });
  });

  afterAll(async () => {
    await User.truncate({ cascade: true });
  });

  describe("Tests for validateAndCheck middleware", () => {
    it("should return 400 if required fields are missing", async () => {
      const res = await request(app).post("/api/register/otp").send({});
      expect(res.statusCode).toBe(400);
    });

    it("should return 409 if user already exists", async () => {
      const res = await request(app)
        .post("/api/register/otp")
        .send(dummyUserData);
      expect(res.statusCode).toBe(409);
    });

    it("should return 404 if user is present but account is deleted", async () => {
      await User.update(
        { isDeleted: true },
        { where: { email: dummyUserData.email } }
      );
      const res = await request(app)
        .post("/api/register/otp")
        .send(dummyUserData);
      expect(res.statusCode).toBe(404);
    });

    it("should call next() if user does not exist", async () => {
      const res = await request(app).post("/api/register/otp").send({
        name: "Usha",
        email: "newuser@gmail.com",
        phoneNumber: "9999988888",
      });

      expect(res.statusCode).toBe(200);
      expect(res.text).toBe('{"message":"OTP sent successfully"}');
    });
  });

  describe("Tests for verifyUserDetails function", () => {
    it("should return 400 if phoneNumber is missing", async () => {
      const res = await request(app)
        .post("/api/auth/status")
        .send({ password: "1234" });
      expect(res.statusCode).toBe(400);
    });

    it("should return 404 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/status")
        .send({ phoneNumber: "8888888888", password: "abcd" });
      expect(res.statusCode).toBe(404);
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app).post("/api/auth/status").send({
        phoneNumber: dummyUserBData.phoneNumber,
        password: "wrongpass",
      });
      expect(res.statusCode).toBe(401);
    });

    it("should return 200 for valid login", async () => {
      const res = await request(app).post("/api/auth/status").send({
        phoneNumber: dummyUserBData.phoneNumber,
        password: dummyUserBData.password,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("isLogin", true);
      expect(res.body).toHaveProperty("email", dummyUserBData.email);
    });
    it("should return 404 if user is present but account is deleted", async () => {
      await User.update(
        { isDeleted: true },
        { where: { email: dummyUserBData.email } }
      );
      const res = await request(app)
        .post("/api/auth/status")
        .send(dummyUserBData);
      expect(res.statusCode).toBe(410);
    });
  });
});
