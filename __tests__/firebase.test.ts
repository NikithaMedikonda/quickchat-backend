import { jest } from "@jest/globals";

describe("firebase.ts - env-based credentials", () => {
  beforeAll(() => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      projectId: "env-project",
    });

    jest.resetModules();
  });

  it("should use FIREBASE_SERVICE_ACCOUNT_JSON env variable", () => {
    jest.mock("firebase-admin", () => ({
      credential: {
        cert: jest.fn((creds) => creds),
      },
      initializeApp: jest.fn(),
      messaging: jest.fn(() => "mockedMessaging"),
    }));

    const fsMock = { readFileSync: jest.fn() };
    jest.mock("fs", () => fsMock);

    const adminModule = require("firebase-admin");
    const { default: admin, messaging } = require("../firebase");

    expect(adminModule.credential.cert).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "env-project" })
    );

    expect(fsMock.readFileSync).not.toHaveBeenCalled();
    expect(adminModule.initializeApp).toHaveBeenCalled();
    expect(messaging).toBe("mockedMessaging");
  });

  afterAll(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  });
});
