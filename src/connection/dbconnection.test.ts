import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

import { SequelizeConnection } from "./dbconnection";
import { Sequelize } from "sequelize";

describe("Sequelize Connection (Controlled)", () => {
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

  it("should create a Sequelize instance", () => {
    expect(testInstance).not.toBeNull();
    expect(typeof testInstance.authenticate).toBe("function");
    expect(testInstance.getDialect()).toBe(process.env.DB_DIALECT);
  });

  it("should successfully authenticate the connection", async () => {
    await expect(testInstance.authenticate()).resolves.not.toThrow();
  });

  it("should throw error if environment variables are not present", async () => {
    delete process.env.DB_DIALECT;
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    try{
      const result = await SequelizeConnection();
      expect(result).toBe(null)
    }
    catch(error:any){
      expect(error.message).toBe("Environment Variables are missing!")
    }
  });
  afterAll(async () => {
    await testInstance?.close();
  });
});
