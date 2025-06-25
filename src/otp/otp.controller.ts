import bcrypt from "bcrypt";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { generateHtml } from "../utils/generateHtml";
import { generateOtpNumber } from "../utils/generateOtp";
import { Otp } from "./otp.model";

export const storeOtpAndSendEmail = async (req: Request, res: Response) => {
  const { name, email } = req.body;
  try {
    await Otp.destroy({ where: { email } });
    const otp = generateOtpNumber();
    const hashedOtp = await bcrypt.hash(String(otp), 10);
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000),
    });
    const sendingEmail = process.env.EMAIL;
    const password = process.env.PASSWORD;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: sendingEmail,
        pass: password,
      },
    });

    await transporter.sendMail({
      from: sendingEmail,
      to: email,
      subject: "Otp Verification - QuickChat Application",
      html: generateHtml(name, otp),
    });
    
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({
        message: `Failed to send OTP, error: ${(error as Error).message}`,
      });
  }
};