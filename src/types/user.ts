export type UserInfo = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  email?: string;
  password: string;
  isDeleted: boolean;
  publicKey: string;
  privateKey: string;
  socketId?: string;
};
export type DbUser = {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
  email: string | null;
  password: string;
  isDeleted: boolean;
  publicKey: string;
  privateKey: string;
  socketId?: string;
};
