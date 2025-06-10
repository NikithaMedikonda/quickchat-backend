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
  isLogin:boolean;
  deviceId: string;
  fcmToken?: string ;

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
  socketId?: string | null;
  isLogin:boolean;
  deviceId:string;
  fcmToken?: string |null;
};
