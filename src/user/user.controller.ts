import bcrypt from "bcrypt";
import * as dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { DbUser, UserInfo } from "../types/user";
import { defaultProfileImage } from "../constants/example.defaultProfile";
import { getProfileImageLink } from "../utils/uploadImage";
import { User } from "./user.model";

dotenv.config();

export async function createUser(user: UserInfo) {
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(user.password, salt);
  const newUser = {
    id: uuidv4(),
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture ? user.profilePicture : null,
    email: user.email ? user.email : null,
    password: hashPassword,
    isDeleted: false,
    publicKey: user.publicKey,
    privateKey: user.privateKey,
    socketId: user.socketId ? user.socketId : null,
    isLogin: false,
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
      where: {
        [Op.or]: [
          { phoneNumber: request.body.phoneNumber },
          { email: request.body.email },
        ],
      },
    });
    if (existingUser) {
      response.status(409).json({
        message: "User already exists with this phone number or email",
      });
    } else {
      const secret_key = process.env.JSON_WEB_SECRET;
      if (!secret_key) {
        response.status(412).json({ message: "No secret key" });
      } else {
        let profileUrl = undefined;
        if (request.body.profilePicture) {
          profileUrl = await getProfileImageLink(request.body.profilePicture);
        }
        const userBody: UserInfo = {
          phoneNumber: request.body.phoneNumber,
          firstName: request.body.firstName,
          lastName: request.body.lastName,
          email: request.body.email,
          password: request.body.password,
          isDeleted: false,
          profilePicture: profileUrl,
          publicKey: request.body.publicKey,
          privateKey: request.body.privateKey,
          socketId: request.body.socketId,
          isLogin: true,
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
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profilePicture: newUser.profilePicture,
          email: newUser.email,
          phoneNumber: newUser.phoneNumber,
          isDeleted: newUser.isDeleted,
          publicKey: newUser.publicKey,
          privateKey: newUser.privateKey,
          socketId: newUser.socketId,
          isLogin: newUser.isLogin,
        };
        response
          .status(200)
          .json({ accessToken: token, refreshToken: refreshToken, user: user });
      }
    }
  } catch (error) {
    response.status(500).send(`${(error as Error).message}`);
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
    if (existingUser.isLogin) {
      response.status(409).json({ message: "User is already logged in" });
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
    existingUser.isLogin = true;
    await existingUser.save();
    const user = {
      id: existingUser.id,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      profilePicture: existingUser.profilePicture,
      email: existingUser.email,
      phoneNumber: existingUser.phoneNumber,
      isDeleted: existingUser.isDeleted,
      publicKey: existingUser.publicKey,
      privateKey: existingUser.privateKey,
      socketId: existingUser.socketId,
      isLogin: existingUser.isLogin,
    };
    response.status(200).json({
      accessToken,
      refreshToken,
      user,
    });
  } catch (error) {
    response.status(500).send(`${(error as Error).message}`);
  }
}

export async function logout(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const { phoneNumber } = request.body;
    const existingUser = await User.findOne({
      where: { phoneNumber },
    });
    if (!existingUser) {
      response
        .status(404)
        .json({ message: "User doesn't exists with this phone number" });
      return;
    }
    if (!existingUser.isLogin) {
      response.status(409).json({ message: "User is already logged out" });
      return;
    }
    const secret_key = process.env.JSON_WEB_SECRET;
    if (!secret_key) {
      response.status(412).json({ message: "Missing JWT secret key" });
      return;
    }
    existingUser.isLogin = false;
    await existingUser.save();
    response.status(200).json({ message: "Successfully logout" });
  } catch (error) {
    response.status(500).send(`${(error as Error).message}`);
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
    let profilePicture = existingUser.dataValues.profilePicture;
    if (user.profilePicture) {
      if (user.profilePicture === defaultProfileImage) {
        profilePicture = user.profilePicture;
      } else {
        profilePicture = await getProfileImageLink(user.profilePicture);
        user.profilePicture = profilePicture;
      }
    } else {
      user.profilePicture = profilePicture;
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
          email: `deletedEmail_${existingUser.id}`,
          password: "deletePhoneNumber",
          isDeleted: true,
          publicKey: "deletedPublicKey",
          privateKey: "deletedPrivateKey",
          socketId: "deletedSocketId",
          isLogin: false,
        },
        { where: { phoneNumber } }
      );
      response.status(200).json({ message: "Account deleted succesfully" });
    }
  } catch (error) {
    console.log(error);
    response.status(500).send(`${(error as Error).message}`);
  }
}

export async function refreshOrValidateAuth(
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
    } catch (error) {
      if ((error as Error).name === "TokenExpiredError") {
        try {
          const decodedRefresh = jwt.verify(refreshToken, secret_key) as
            | string
            | jwt.JwtPayload;
          const phoneNumber =
            typeof decodedRefresh === "string"
              ? decodedRefresh
              : decodedRefresh.phoneNumber;
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

          const newRefreshToken = jwt.sign(
            { phoneNumber: user.phoneNumber },
            secret_key
          );

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
  } catch (error) {
    response.status(500).send(`${(error as Error).message}`);
  }
}

export async function contactDetails(
  request: Request,
  response: Response
): Promise<void> {
  try {
    const phoneNumbersList: string[] = request.body;

    const users = await User.findAll({
      where: {
        phoneNumber: {
          [Op.in]: phoneNumbersList,
        },
      },
      attributes: ["firstName", "lastName", "phoneNumber", "profilePicture"],
    });

    const registeredUsers = users.map((user) => ({
      name: `${user.firstName} ${user.lastName}`,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture,
    }));

    const registeredPhoneNumbers = users.map((user) => user.phoneNumber);

    const unRegisteredUsers = phoneNumbersList.filter(
      (phone) => !registeredPhoneNumbers.includes(phone)
    );

    response.status(200).json({
      data: {
        registeredUsers: registeredUsers,
        unRegisteredUsers: unRegisteredUsers,
      },
    });
  } catch (error) {
    response.status(500).json({ message: `${(error as Error).message}` });
  }
}
