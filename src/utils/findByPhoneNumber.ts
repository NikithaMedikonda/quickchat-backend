import { User } from "../user/user.model";

export const findByPhoneNumber = async (phoneNumber: string) => {
  try {
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new Error("User not found with the phone number");
    }
    return user.id;
  } catch (error) {
    throw new Error(
      `Error while fetching the user ${(error as Error).message}`
    );
  }
};

export const findByUserId = async (userId: string) => {
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found with the Id");
    }
    return user.phoneNumber;
  } catch (error) {
    throw new Error(
      `Error while fetching the user ${(error as Error).message}`
    );
  }
  
};