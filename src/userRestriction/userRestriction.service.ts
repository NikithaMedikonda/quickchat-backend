import { UserRestriction } from "./userRestriction.model";

export const addBlockedUserEntry = async (
  blockerId: string,
  blockedId: string
): Promise<UserRestriction> => {
  try {
    const blockUserDetails = await UserRestriction.create({
      blocker: blockerId,
      blocked: blockedId,
    });
    return blockUserDetails;
  } catch (error) {
    throw new Error(
      `Error occurred while blocking user : ${(error as Error).message}`
    );
  }
};

export const removeBlockedUserEntry = async (
  blockerId: string,
  blockedId: string
): Promise<void> => {
  try {
    const blockedEntry = await UserRestriction.findOne({
      where: {
        blocker: blockerId,
        blocked: blockedId,
      },
    });

    if (!blockedEntry) {
      throw new Error("Blocked entry not found.");
    }

    await blockedEntry.destroy();
  } catch (error) {
    throw new Error(
      `Error occurred while unblocking user: ${(error as Error).message}`
    );
  }
};
