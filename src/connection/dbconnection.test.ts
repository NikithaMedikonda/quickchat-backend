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

  it("should throw error if environment variables are not present", () => {
    delete process.env.DB_DIALECT;
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;

    expect(() => {
      SequelizeConnection();
    }).toThrow("Environment Variables are missing!");
  });

  it("should catch and throw a new error if Sequelize throws internally", () => {
    process.env.DB_DIALECT = "postgres";
    process.env.DB_HOST = "invalid-host"; 
    process.env.DATABASE_URL = "invalid-url"; 

    try {
      SequelizeConnection();
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toContain("Error while connecting to database");
      } 
    }
  });

   afterAll(async () => {
    if (testInstance) {
      await testInstance.close();
    }
  });
});
