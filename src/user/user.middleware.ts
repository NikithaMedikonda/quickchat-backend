import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import passwordValidator from "password-validator";
import { Op } from "sequelize";
import { User } from "./user.model";

dotenv.config();

export function validateEmail(inputEmail: string) {
  const mailformat = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (inputEmail.match(mailformat)) {
    return true;
  } else {
    return false;
  }
}

export function validatePassword(inputPassword: string) {
  const schema = new passwordValidator();
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
  const phonePattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (
    !request.body.phoneNumber ||
    !request.body.firstName ||
    !request.body.lastName ||
    !request.body.password ||
    !request.body.email
  ) {
    response.sendStatus(400);
  } else if (!request.body.phoneNumber.match(phonePattern)) {
    response.sendStatus(401);
  } else if (!validateEmail(request.body.email)) {
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
  const phonePattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!request.body.phoneNumber || !request.body.password) {
    response.sendStatus(400);
  } else if (!request.body.phoneNumber.match(phonePattern)) {
    response.sendStatus(401);
  } else {
    next();
  }
}

export async function validateLogOutInputFields(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const phonePattern =
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (!request.body.phoneNumber) {
    response.sendStatus(400);
  } else if (!request.body.phoneNumber.match(phonePattern)) {
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
    jwt.verify(token, secret_key, (error) => {
      if (error) {
        response.sendStatus(403);
      } else {
        next();
      }
    });
  }
}

export async function validateAndCheck(
  request: Request,
  response: Response,
  next: NextFunction
) {
  if (!request.body.phoneNumber || !request.body.email || !request.body.name) {
    response.sendStatus(400);
  } else {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { phoneNumber: request.body.phoneNumber },
          { email: request.body.email },
        ],
      },
    });
    if (existingUser && existingUser.isDeleted === true) {
      response.sendStatus(404);
    } else if (existingUser) {
      response.sendStatus(409);
    } else {
      next();
    }
  }
}

export async function verifyUserDetails(request: Request, response: Response) {
  if (!request.body.phoneNumber) {
    response.status(400).json({ message: "Please provide phone number." });
    return;
  }
  const existingUser = await User.findOne({
    where: { phoneNumber: request.body.phoneNumber },
  });
  if (existingUser && existingUser.isDeleted === true) {
    response.status(410).json({ message: "Sorry, this account is deleted" });
    return;
  } else if (!existingUser) {
    response
      .status(404)
      .json({ message: "User doesn't exist with this phone number" });
    return;
  }
  const validPassword = await bcrypt.compare(
    request.body.password,
    existingUser.password
  );
  if (!validPassword) {
    response.status(401).json({ message: "Password is invalid" });
    return;
  }
  response.status(200).json({
    isLogin: existingUser.isLogin,
    name: `${existingUser.firstName} ${existingUser.lastName}`,
    email: existingUser.email,
  });
}
