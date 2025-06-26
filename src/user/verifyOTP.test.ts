import bcrypt from 'bcrypt';
import request from "supertest";
import { app } from "../../server";
import { Otp } from "../otp/otp.model";

describe("Test for OTP verification", () => {
  const testEmail = "verifytest@gmail.com";
  const otpPlain = "1234";

  beforeAll(async () => {
    await Otp.truncate({cascade:true})
  });

  afterEach(async () => {
    await Otp.truncate({cascade:true})
  });

  it("should return 404 if OTP not found", async () => {
    const res = await request(app).post("/api/verify-otp").send({
      email: "notfound@gmail.com",
      otp: "000000",
    });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/No OTP found/);
  });

  it("should return 410 if OTP is expired", async () => {
    const expiredTime = new Date(Date.now() - 5 * 60 * 1000);
    const hashed = await bcrypt.hash(otpPlain, 10);
    await Otp.create({
      email: testEmail,
      otp: hashed,
      expiresAt: expiredTime,
    });

    const res = await request(app).post("/api/verify-otp").send({
      email: testEmail,
      otp: otpPlain,
    });

    expect(res.statusCode).toBe(410);
    expect(res.body.message).toMatch(/expired/);
  });

  it("should return 401 if OTP is invalid", async () => {
    const futureTime = new Date(Date.now() + 5 * 60 * 1000); 
    const hashed = await bcrypt.hash("999999", 10);
    await Otp.create({
      email: testEmail,
      otp: hashed,
      expiresAt: futureTime,
    });

    const res = await request(app).post("/api/verify-otp").send({
      email: testEmail,
      otp: "000000",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Invalid OTP/);
  });

  it("should return 200 if OTP is correct and not expired", async () => {
    const validTime = new Date(Date.now() + 2 * 60 * 1000);
    const hashed = await bcrypt.hash(otpPlain, 10);
    await Otp.create({
      email: testEmail,
      otp: hashed,
      expiresAt: validTime,
    });

    const res = await request(app).post("/api/verify-otp").send({
      email: testEmail,
      otp: otpPlain,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ isverified: true });
  });

  it("should return 500 if DB throws error (force error)", async () => {
    const original = Otp.findOne;
    Otp.findOne = () => {
      throw new Error("Test DB error");
    };

    const res = await request(app).post("/api/verify-otp").send({
      email: testEmail,
      otp: otpPlain,
    });

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toMatch(/Test DB error/);
    Otp.findOne = original;
  });
});