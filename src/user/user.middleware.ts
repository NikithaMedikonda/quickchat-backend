import { NextFunction, Request, Response } from "express";
import * as dotenv from "dotenv";
import passwordValidator from "password-validator";

dotenv.config();

export async function validateEmail(inputEmail: string) {
  var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (inputEmail.match(mailformat)) {
    return true;
  } else {
    return false;
  }
}

export async function validatePassword(inputPassword: string): Promise<any> {
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
    .spaces()
  return schema.validate(inputPassword);
}

export async function validateInputFields(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<any> {
  try {
    if (
      !request.body.phoneNumber ||
      !request.body.firstName ||
      !request.body.lastName ||
      !request.body.password
    ) {
      return response.sendStatus(400);
    } else if (request.body.phoneNumber.length !== 10) {
      return response.sendStatus(401);
    } else if (
      request.body.email &&
      !(await validateEmail(request.body.email))
    ) {
      return response.sendStatus(400);
    } else if (!(await validatePassword(request.body.password))) {
      return response.sendStatus(406);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
}
