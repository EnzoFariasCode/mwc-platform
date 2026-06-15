import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
      userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
      industry?: "TECH" | "HEALTH";
      jobTitle?: string | null;
      isActive?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    industry?: "TECH" | "HEALTH";
    jobTitle?: string | null;
    isActive?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    industry?: "TECH" | "HEALTH";
    jobTitle?: string | null;
    isActive?: boolean;
  }
}
