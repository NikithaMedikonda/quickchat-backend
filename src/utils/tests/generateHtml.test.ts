import { generateHtml } from "../generateHtml";

describe("Test for generateHtml Function", () => {
  const name = "Usha";
  const otp = 1234;

  let html: string;

  beforeAll(() => {
    html = generateHtml(name, otp);
  });

  it("should return a string", () => {
    expect(typeof html).toBe("string");
  });

  it("should include the user's name", () => {
    expect(html).toContain(`Hi ${name}`);
  });

  it("should include the OTP", () => {
    expect(html).toContain(otp.toString());
  });

  it("should include OTP expiration message", () => {
    expect(html).toMatch(/expire in 2 minutes/i);
  });

  it("should include QuickChat branding", () => {
    expect(html).toMatch(/QUICKCHAT OTP VERIFICATION/i);
    expect(html).toMatch(/Thank you for using QuickChat/i);
  });

  it("should contain basic HTML structure", () => {
    expect(html).toContain("<html>");
    expect(html).toContain("<head>");
    expect(html).toContain("<body>");
    expect(html).toContain("</html>");
  });

  it("should render OTP with correct styling", () => {
    expect(html).toContain('class="otp"');
    expect(html).toMatch(new RegExp(`<div class="otp">${otp}</div>`));
  });
});
