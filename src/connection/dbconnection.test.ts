import { SequelizeConnection } from "./dbconnection";
import { Sequelize } from "sequelize";

jest.mock("sequelize", () => ({
  Sequelize: jest.fn().mockImplementation((config) => ({
    config: {
      ...config,
      database: "postgres",
      host: "localhost",
      username: "postgres_user",
      password: "postgres_password",
    },
    authenticate: jest.fn().mockResolvedValue(true),
  })),
}));

describe("SequlizeConnection", () => {
  const originalEnv = process.env;
  const originalConsoleError = console.error;

  beforeEach(() => {
    process.env = { ...originalEnv };
    console.error = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  it("should connect to the database successfully", async () => {
    const sequelizeInstance = await SequelizeConnection();
    expect(Sequelize).toHaveBeenCalled();
    expect(sequelizeInstance).toBeTruthy();
    expect(sequelizeInstance).not.toBeUndefined()
    expect(sequelizeInstance!.config.host).toBe("localhost");
    expect(sequelizeInstance!.config.database).toBe("postgres");
    expect(sequelizeInstance!.config.username).toBe("postgres_user");
    expect(sequelizeInstance!.config.password).toBe("postgres_password");
  });

  it("should console error if environment variables are missing", async () => {
    delete process.env.DB_DIALECT;
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    const result = SequelizeConnection();

    expect(console.error).toHaveBeenCalledWith("Environment Variables missing!");
    expect(result).toBeUndefined();
  });
});
