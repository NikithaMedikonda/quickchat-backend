import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { DbUser, user } from "../types/user";
import { getProfileImageLink } from "../utils/uploadImage";
import { User } from "./user.model";

dotenv.config();

export async function createUser(user: user) {
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(user.password, salt);
  const newUser: DbUser = {
    id: uuidv4(),
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture ? user.profilePicture : null,
    email: user.email,
    password: hashPassword,
    isDeleted: false,
  };
  const createdUser: DbUser = await User.create(newUser);
  return createdUser;
}

export async function register(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const existingUser = await User.findOne({
      where: { phoneNumber: request.body.phoneNumber },
    });
    if (existingUser) {
      response
        .status(409)
        .json({ message: "User already exists with this phone number" });
    } else {
      const secret_key = process.env.JSON_WEB_SECRET;
      if (!secret_key) {
        response.status(412).json({ message: "No secret key" });
      } else {
        let profileUrl = undefined;
        if (request.body.profilePicture) {
          profileUrl = await getProfileImageLink(request.body.profilePicture);
        }
        const userBody: user = {
          phoneNumber: request.body.phoneNumber,
          firstName: request.body.firstName,
          lastName: request.body.lastName,
          email: request.body.email,
          password: request.body.password,
          isDeleted: false,
          profilePicture: profileUrl,
        };
        const newUser: DbUser = await createUser(userBody);
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
        const user = {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profilePicture: newUser.profilePicture,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          isDeleted: newUser.isDeleted,
        };
        response
          .status(200)
          .json({ accessToken: token, refreshToken: refreshToken, user: user });
      }
    }
  } catch (e: any) {
    console.log(e)
    response.status(500).send(e.message);
  }
}

export async function login(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const { phoneNumber, password } = request.body;
    const existingUser = await User.findOne({
      where: { phoneNumber },
    });
    if (!existingUser) {
      response
        .status(404)
        .json({ message: "User doesn't exists with this phone number" });
      return;
    }
    const validPassword = await bcrypt.compare(password, existingUser.password);
    if (!validPassword) {
      response.status(401).json({ message: "Password is invalid" });
      return;
    }
    const secret_key = process.env.JSON_WEB_SECRET;
    if (!secret_key) {
      response.status(412).json({ message: "Missing JWT secret key" });
      return;
    }
    const accessToken = jwt.sign(
      { phoneNumber: existingUser.phoneNumber },
      secret_key,
      { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(existingUser.phoneNumber, secret_key);
    const user = {
      id: existingUser.id,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      profilePicture: existingUser.profilePicture,
      email: existingUser.email,
      phoneNumber: existingUser.phoneNumber,
      isDeleted: existingUser.isDeleted,
    };
    response.status(200).json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (e: any) {
    response.status(500).send(e.message);
  }
}

export async function checkAuth(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    const refreshToken = request.headers["x-refresh-token"] as string;

    if (!authHeader || !refreshToken) {
      response.status(400).json({ message: "Missing tokens in headers" });
      return;
    }

    const accessToken = authHeader.split(" ")[1];
    const secret_key = process.env.JSON_WEB_SECRET;
    if (!secret_key) {
      response.status(412).json({ message: "Missing JWT secret key" });
      return;
    }

    try {
      const decoded = jwt.verify(accessToken, secret_key) as jwt.JwtPayload;
      const user = await User.findOne({
        where: { phoneNumber: decoded.phoneNumber },
      });

      if (!user) {
        response.status(404).json({ message: "User not found" });
        return;
      }

      response.status(200).json({ message: "Access token valid" });
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        try {
          const decodedRefresh = jwt.verify(refreshToken, secret_key) as string | jwt.JwtPayload;
          const phoneNumber = typeof decodedRefresh === 'string' ? decodedRefresh : decodedRefresh.phoneNumber;
          const user = await User.findOne({ where: { phoneNumber } });

          if (!user) {
            response.status(404).json({ message: "User not found" });
            return;
          }

          const newAccessToken = jwt.sign(
            { phoneNumber: user.phoneNumber },
            secret_key,
            { expiresIn: "7d" }
          );

          const newRefreshToken = jwt.sign({ phoneNumber: user.phoneNumber }, secret_key);

          response.status(200).json({
            message: "New access token issued",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });
        } catch {
          response.status(403).json({ message: "Invalid refresh token" });
        }
      } else {
        response.status(403).json({ message: "Invalid access token" });
      }
    }
  } catch (error: any) {
    response.status(500).send(error.message);
  }
}
