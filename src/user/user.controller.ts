import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { defaultProfileImage } from "../constants/example.defaultProfile";
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
  } catch (error: any) {
    response.status(500).send(error.message);
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
  } catch (error: any) {
    response.status(500).send(error.message);
  }
}

export async function update(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const user = request.body;
    if (!user.phoneNumber) {
      response.status(400).json({
        message: "Phone Number is required to change the profile image.",
      });
      return;
    }
    const existingUser = await User.findOne({
      where: { phoneNumber: user.phoneNumber },
    });
    if (!existingUser) {
      response.status(404).send({
        message: "No user exists with the given phone number.",
      });
      return;
    }
    if (user.profilePicture) {
      let profilePicture = null;
      if (user.profilePicture === defaultProfileImage) {
        profilePicture = user.profilePicture;
      } else {
        profilePicture = await getProfileImageLink(user.profilePicture);
        user.profilePicture = profilePicture;
      }
    }
    await existingUser.update(user);
    response.status(200).json({
      message: "Profile updated successfully.",
      user: existingUser,
    });
  } catch (error) {
    response.status(500).json({ error: error });
  }
}

export async function deleteAccount(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const { phoneNumber } = request.body;
    const existingUser = await User.findOne({
      where: { phoneNumber: request.body.phoneNumber, isDeleted: false },
    });
    if (!existingUser) {
      response.status(404).json({ message: "Invalid phone number" });
    } else {
      await User.update(
        {
          firstName: "deleteFirstName",
          lastName: "deleteLasttName",
          profilePicture: "",
          phoneNumber: `deletedPhoneNumber_${existingUser.id}`,
          email:`deletedEmail_${existingUser.id}`,
          password: "deletePhoneNumber",
          isDeleted: true,
        },
        { where: { phoneNumber } }
      );
      response.status(200).json({ message: "Account deleted succesfully" });
    }
  } catch (error: any) {
    response.status(500).send(error.message);
  }
}
