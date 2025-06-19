export type MessageData = {
  message: string;
};
export type PrivateMessage = {
  recipientPhoneNumber: string;
  senderPhoneNumber: string;
  message: string;
  timestamp: string;
  status: string;
};
export type updateMessageDetails = {
  senderPhoneNumber: string;
  receiverPhoneNumber: string;
  messages: string[];
};
export type DeliveredMessageDetails = {
  senderId: string;
  message: string[];
};
