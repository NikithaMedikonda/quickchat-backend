import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { authenticateToken } from "./user.middleware";
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
