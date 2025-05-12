export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
  bio?: string;
  role: "user" | "admin" | "developer";
  createdAt: string;
  updatedAt: string;
}