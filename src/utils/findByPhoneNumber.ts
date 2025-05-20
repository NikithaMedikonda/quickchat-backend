import { User } from "../user/user.model";

export const findByPhoneNumber = async (phoneNumber: string) => {
  try {
    const user = await User.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new Error("User not found with the phone number");
    }
    return user.id;
  } catch (error) {
    throw new Error(`${error}`);
  }
};

