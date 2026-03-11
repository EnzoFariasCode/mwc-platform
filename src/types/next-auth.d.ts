import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  }
}
