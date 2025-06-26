import { generateOtpNumber } from "../generateOtp";

describe("Tests for generateOtpNumber", () => {
  it("should return a number", () => {
    const otp = generateOtpNumber();
    expect(typeof otp).toBe("number");
  });

  it("should return a 4-digit number", () => {
    const otp = generateOtpNumber();
    expect(otp).toBeGreaterThanOrEqual(1000);
    expect(otp).toBeLessThanOrEqual(9999);
  });

  it("should generate different numbers", () => {
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(generateOtpNumber());
    }
    expect(results.size).toBeGreaterThan(1); 
  });
});
