import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { DbUser, user } from "../types/user";
import { User } from "./user.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

dotenv.config();

export async function createUser(user: user) {
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(user.password, salt);
  const newUser: DbUser = {
    id: uuidv4(),
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture,
    email: user.email,
    password: hashPassword,
    isDeleted: false,
  };
  const createdUser = await User.create(newUser);
  return createUser;
}

export async function register(
  request: Request,
  response: Response
): Promise<any> {
  try {
    const secret_key = process.env.JSON_WEB_SECRET;
    if (!secret_key) {
      return response.status(412).json({ message: "No secret key" });
    }
    const existingUser = await User.findOne({
      where: { phoneNumber: request.body.phoneNumber },
    });
    if (existingUser) {
      return response
        .status(409)
        .json({ message: "User already exists with this phone number" });
    }
    const newUser = await createUser(request.body);
    const token = jwt.sign(
      { phoneNumber: request.body.phoneNumber },
      secret_key.toString(),
      {
        expiresIn: "7d",
      }
    );
    const refreshToken = jwt.sign(
      request.body.phoneNumber,
      secret_key.toString()
    );
    return response
      .status(200)
      .json({ accessToken: token, refreshToken: refreshToken, user: newUser });
  } catch (e: any) {
    return response.status(500).send(e.message);
  }
}
