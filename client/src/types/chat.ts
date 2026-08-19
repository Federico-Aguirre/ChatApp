export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "online" | "offline";
}

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  isDirect: boolean;
  isPrivate?: boolean;
  createdBy?: string | User;
  admins?: (string | User)[];
  members: User[];
}

export interface Message {
  _id: string;
  channelId: string;
  sender: User;
  content: string;
  fileUrl?: string;
  createdAt: string;
}