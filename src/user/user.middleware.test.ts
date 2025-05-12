import { NextFunction, Request, Response } from "express";
import { authenticateToken } from "./user.middleware";

describe("Authentication route", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockSend: jest.Mock;
  let mockBody: jest.Mock;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    (mockBody = jest.fn()),
      (mockNext = jest.fn()),
      (mockResponse = {
        sendStatus: jest.fn().mockReturnThis(),
        send: mockSend,
        json: mockBody.mockReturnThis(),
      });
    jest.clearAllMocks();
  });



  it("should call the next function", async () => {
    mockRequest = {
      headers: {
        authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwaG9uZU51bWJlciI6Ijg1MjIwNDE2OTkiLCJpYXQiOjE3NDcwNDI1MzMsImV4cCI6MTc0NzY0NzMzM30.zfGO0o56jDmcPTEulBNiI_aPK15rWG-oKKXvL_64X3w",
      },
      body: {},
    };
    process.env.JSON_WEB_SECRET = "quick_chat_secret";
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it("should return 401 ", async () => {
    mockRequest = { headers: {}, body: {} };
    process.env.JSON_WEB_SECRET = "quick_chat_secret";
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext as NextFunction
    );
    expect(mockResponse.sendStatus).toHaveBeenCalledWith(401);
  });

  it("should return 403 ", async () => {
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
  it("should return 412 ", async () => {
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
