import { BlockedUsers } from "./blocked-users.model";

export const addBlockedUserEntry = async (
  blockerId: string,
  blockedId: string
): Promise<BlockedUsers> => {
  try {
    const blockUserDetails = await BlockedUsers.create({
      blocker: blockerId,
      blocked: blockedId,
    });
    return blockUserDetails;
  } catch (error) {
    throw new Error(`Error occurred while blocking user : ${(error as Error).message}`);
  }
};

