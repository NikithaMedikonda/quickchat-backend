import { Request, Response } from "express";
import { findByPhoneNumber } from "../utils/findByPhoneNumber";
import { BlockedUsers } from "./blocked-users.model";
import {
  addBlockedUserEntry,
  removeBlockedUserEntry,
} from "./blocked-users.service";

export const executeUserBlock = async (req: Request, res: Response) => {
  try {
    const blockerPhoneNumber = req.body.blockerPhoneNumber;
    const blockedPhoneNumber = req.body.blockedPhoneNumber;

    if (!blockerPhoneNumber || !blockedPhoneNumber) {
      res
        .status(400)
        .json({ message: "Please provide all the necessary fields." });
      return;
    }

    const blockerId = await findByPhoneNumber(blockerPhoneNumber);
    const blockedId = await findByPhoneNumber(blockedPhoneNumber);

    if (blockerId === blockedId) {
      res.status(400).json({ message: "You cannot block yourself." });
      return;
    }

    const existingBlockedUser = await BlockedUsers.findOne({
      where: {
        blocker: blockerId,
        blocked: blockedId,
      },
    });

    if (existingBlockedUser) {
      res.status(409).json({ message: "You have already blocked this user." });
      return;
    }

    const blockedUsers: BlockedUsers = await addBlockedUserEntry(
      blockerId,
      blockedId
    );

    res.status(200).json({
      message: "User blocked successfully.",
      blockedUsersDetails: blockedUsers,
    });
  } catch (error) {
    res.status(500).json({ message: `${(error as Error).message}` });
  }
};

export const executeUserUnblock = async (req: Request, res: Response) => {
  try {
    const blockerPhoneNumber = req.body.blockerPhoneNumber;
    const blockedPhoneNumber = req.body.blockedPhoneNumber;

    if (!blockerPhoneNumber || !blockedPhoneNumber) {
      res
        .status(400)
        .json({ message: "Please provide all the necessary fields." });
      return;
    }

    const blockerId = await findByPhoneNumber(blockerPhoneNumber);
    const blockedId = await findByPhoneNumber(blockedPhoneNumber);

    if (blockerId === blockedId) {
      res.status(400).json({ message: "You cannot unblock yourself." });
      return;
    }

    const existingBlockedUser = await BlockedUsers.findOne({
      where: {
        blocker: blockerId,
        blocked: blockedId,
      },
    });

    if (!existingBlockedUser) {
      res.status(404).json({ message: "This user is not blocked." });
      return;
    }
    await removeBlockedUserEntry(blockerId, blockedId);

    res.status(200).json({
      message: "User unblocked successfully.",
      unblockedUsersDetails: existingBlockedUser,
    });
  } catch (error) {
    res.status(500).json({ message: `${(error as Error).message}` });
  }
};
