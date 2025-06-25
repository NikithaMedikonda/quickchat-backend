import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../../server";
import { User } from "../user/user.model";
import { Otp } from "./otp.model";

describe("Test for storeOtpAndSendEmail function", () => {
  const dummyUserData = {
    phoneNumber: "9999999999",
    email: "usri4863@gmail.com",
    name: "Test User",
    password: "Secret123",
  };

  afterAll(async () => {
    await Otp.truncate({ cascade: true });
    await User.truncate({ cascade: true });
  });

  it("should create user", async () => {
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
  });
  it("should send OTP and create record in DB", async () => {
    const response = await request(app).post("/api/login/otp").send({
      name: dummyUserData.name,
      email: dummyUserData.email,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toMatch(/OTP sent successfully/i);

    const otpEntry = await Otp.findOne({
      where: { email: dummyUserData.email },
    });

    expect(otpEntry).not.toBeNull();
    expect(otpEntry!.otp).toBeDefined();
    expect(new Date(otpEntry!.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
  it("should return 500 if email config is missing", async () => {
    const originalEmail = process.env.EMAIL;
    const originalPassword = process.env.PASSWORD;

    delete process.env.EMAIL;
    delete process.env.PASSWORD;

    const response = await request(app).post("/api/login/otp").send({
      name: dummyUserData.name,
      email: dummyUserData.email,
    });

    expect(response.statusCode).toBe(500);
    expect(response.body.message).toMatch(/Failed to send OTP/i);
    process.env.EMAIL = originalEmail;
    process.env.PASSWORD = originalPassword;
  });
});
