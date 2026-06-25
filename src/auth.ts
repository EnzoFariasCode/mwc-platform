import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getRateLimitKeys, rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/modules/auth/services/welcome-email-service";

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
const LOGIN_LIMIT_EMAIL = 5;
const LOGIN_LIMIT_IP = 15;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
type AuthUserExtras = {
  userType?: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry?: "TECH" | "HEALTH";
  jobTitle?: string | null;
  isActive?: boolean;
  adminRole?: "OWNER" | "FINANCE" | "SUPPORT" | null;
};

async function getAuthUserFields(userId?: string, email?: string | null) {
  if (!userId && !email) return null;

  const users = await db.$queryRaw<
    Array<{
      id: string;
      userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
      industry: "TECH" | "HEALTH";
      jobTitle: string | null;
      isActive: boolean;
      adminRole: "OWNER" | "FINANCE" | "SUPPORT" | null;
    }>
  >`
    SELECT id, "userType", industry, "jobTitle", "isActive", "adminRole"
    FROM "User"
    WHERE ${userId ? Prisma.sql`id = ${userId}` : Prisma.sql`false`}
      OR ${email ? Prisma.sql`email = ${email}` : Prisma.sql`false`}
    LIMIT 1
  `;

  return users[0] ?? null;
}

async function storeRemoteProfileImage(userId: string, imageUrl: string) {
  const existing = await db.user.findUnique({
    where: { id: userId },
    select: { profileImageBytes: true, profileImageType: true },
  });

  if (existing?.profileImageBytes && existing.profileImageType) return;

  const response = await fetch(imageUrl, { cache: "no-store" });
  if (!response.ok) return;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) return;

  const contentLength = response.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_PROFILE_IMAGE_BYTES) return;

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_PROFILE_IMAGE_BYTES) return;

  await db.user.update({
    where: { id: userId },
    data: {
      profileImageBytes: Buffer.from(arrayBuffer),
      profileImageType: contentType,
    },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        const email = profile.email?.toString().toLowerCase() ?? "";
        return {
          id: profile.sub,
          name: profile.name || email.split("@")[0] || "Usuario MWC",
          email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        const [ipKey, emailKey] = await getRateLimitKeys("auth-login", email);
        const ipLimit = await rateLimit(
          ipKey,
          LOGIN_LIMIT_IP,
          LOGIN_WINDOW_MS,
        );
        const emailLimit = await rateLimit(
          emailKey,
          LOGIN_LIMIT_EMAIL,
          LOGIN_WINDOW_MS,
        );

        if (!ipLimit.allowed || !emailLimit.allowed) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        const authUser = await getAuthUserFields(user.id, user.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          userType: user.userType,
          industry: user.industry,
          jobTitle: user.jobTitle,
          isActive: authUser?.isActive ?? true,
          adminRole: authUser?.adminRole ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (
        account?.provider === "google" &&
        (profile as { email_verified?: boolean } | undefined)
          ?.email_verified !== true
      ) {
        return "/login?error=oauth_unverified_email";
      }

      const dbUser = await getAuthUserFields(user.id, user.email);

      if (dbUser?.isActive === false) {
        return "/login?error=account_suspended";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      const dbUser = await getAuthUserFields(
        token.id as string | undefined,
        token.email,
      );

      if (dbUser) {
        token.id = dbUser.id;
        token.role = dbUser.userType;
        token.userType = dbUser.userType;
        token.industry = dbUser.industry;
        token.jobTitle = dbUser.jobTitle;
        token.isActive = dbUser.isActive;
        token.adminRole = dbUser.adminRole;
        return token;
      }

      if (user) {
        const authUser = user as typeof user & AuthUserExtras;
        token.role = authUser.userType || "CLIENT";
        token.userType = authUser.userType || "CLIENT";
        token.industry = authUser.industry || "TECH";
        token.jobTitle = authUser.jobTitle || null;
        token.isActive = authUser.isActive ?? true;
        token.adminRole = authUser.adminRole ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CLIENT" | "PROFESSIONAL" | "ADMIN";
        session.user.userType = token.userType as AuthUserExtras["userType"];
        session.user.industry = token.industry as AuthUserExtras["industry"];
        session.user.jobTitle = token.jobTitle as AuthUserExtras["jobTitle"];
        session.user.isActive = token.isActive as boolean | undefined;
        session.user.adminRole = token.adminRole as AuthUserExtras["adminRole"];
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        const dbUser = await getAuthUserFields(user.id, user.email);
        await sendWelcomeEmail({
          email: user.email ?? null,
          name: user.name ?? null,
          userType: dbUser?.userType ?? "CLIENT",
          industry: dbUser?.industry ?? "TECH",
        });
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    },
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider !== "google" || !user?.id) return;
        const imageUrl =
          (profile as { picture?: string } | undefined)?.picture || user.image;
        if (!imageUrl) return;

        await storeRemoteProfileImage(user.id, imageUrl);
      } catch (error) {
        console.error("Failed to store Google profile image:", error);
      }
    },
  },
});
