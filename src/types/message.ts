export type MessageData = {
  message: string;
};
export type PrivateMessage = {
  toUserId: number;
  fromUserId: number;
  message: string;
  timestamp: string;
};
