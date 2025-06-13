import admin, { messaging } from "../../firebase";
import * as rawJson from '../../serviceAccountKey.json'

describe("Firebase Admin Initialization (Real Test)", () => {
  it("should initialize Firebase app", () => {
    const apps = admin.apps;
    expect(apps.length).toBeGreaterThan(0);
    expect(apps[0]!.name).toBe("[DEFAULT]");
  });

  it("should expose a valid messaging instance", () => {
    expect(messaging).toBeDefined();
    expect(typeof messaging.send).toBe("function");
  });
});

describe("Firebase Admin Initialization using ENV variable", () => {
  beforeAll(() => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify(rawJson);
  });

  afterAll(() => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    jest.resetModules(); 
  });

  it("should initialize Firebase using the environment variable", async () => {
    expect(admin.apps.length).toBeGreaterThan(0);
    expect(typeof messaging.send).toBe("function");
  });
});