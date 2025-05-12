export type user = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profilePicture?: string ;
  email?: string ;
  password: string;
  isDeleted: boolean;
};
export type DbUser = {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null ;
  email?: string ;
  password: string;
  isDeleted: boolean;
};
export type partialUser = Partial<user>
