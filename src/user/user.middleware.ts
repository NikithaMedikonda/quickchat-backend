import * as dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
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
