import * as dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passwordValidator from "password-validator";
dotenv.config();

export function validateEmail(inputEmail: string) {
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (inputEmail.match(mailformat)) {
    return true;
  } else {
    return false;
  }
}

export function validatePassword(inputPassword: string) {
  var schema = new passwordValidator();
  schema
    .is()
    .min(8)
    .is()
    .max(16)
    .has()
    .uppercase(1)
    .has()
    .lowercase(1)
    .has()
    .digits(1)
    .has()
    .not()
    .spaces();
  return schema.validate(inputPassword);
}

export async function validateInputFields(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  if (
    !request.body.phoneNumber ||
    !request.body.firstName ||
    !request.body.lastName ||
    !request.body.password
  ) {
    response.sendStatus(400);
  } else if (request.body.phoneNumber.length !== 10) {
    response.sendStatus(401);
  } else if (request.body.email && !validateEmail(request.body.email)) {
    response.sendStatus(400);
  } else if (!validatePassword(request.body.password)) {
    response.sendStatus(406);
  } else {
    next();
  }
}

export async function validateLoginInputFields(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  if (!request.body.phoneNumber || !request.body.password) {
    response.sendStatus(400);
  } else if (request.body.phoneNumber.length !== 10) {
    response.sendStatus(401);
  } else {
    next();
  }
}
export async function authenticateToken(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = request.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const secret_key = process.env.JSON_WEB_SECRET;
  if (!secret_key) {
    response.sendStatus(412);
  } else if (token == null) {
    response.sendStatus(401);
  } else {
    jwt.verify(token, secret_key, (error: any) => {
      if (error) {
        response.sendStatus(403);
      } else {
        next();
      }
    });
  }
}
