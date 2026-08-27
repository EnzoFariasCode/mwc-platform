import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getRateLimitKeys, rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/modules/auth/services/welcome-email-service";
import { cookies, headers } from "next/headers";
import {
  GOOGLE_AUTH_INTENT_COOKIE,
  GOOGLE_REGISTRATION_COOKIE,
  type GoogleRegistrationConsent,
  readGoogleAuthIntent,
  readGoogleRegistrationConsent,
} from "@/modules/auth/lib/google-registration-consent";
import { normalizePersonName } from "@/modules/users/lib/normalize-person-name";

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

async function persistGoogleTermsAcceptance(
  userId: string,
  consent: GoogleRegistrationConsent,
) {
  const existingAcceptance = await db.termsAcceptance.findFirst({
    where: { userId },
    select: { id: true },
  });
  if (existingAcceptance) return false;

  const birthDate = new Date(`${consent.birthDate}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    throw new Error("Invalid birth date in signed Google consent");
  }

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { birthDate },
    }),
    db.termsAcceptance.create({
      data: {
        userId,
        ipAddress,
        userAgent: requestHeaders.get("user-agent") || undefined,
        generalTermsVersion: consent.generalTermsVersion,
        privacyPolicyVersion: consent.privacyPolicyVersion,
      },
    }),
  ]);

  return true;
}

function getGoogleTermsRegistrationPath(intentValue?: string) {
  const params = new URLSearchParams({ error: "google_terms_required" });
  const intent = readGoogleAuthIntent(intentValue);
  if (intent) params.set("callbackUrl", intent.callbackPath);
  return `/cadastro?${params.toString()}`;
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
          name: normalizePersonName(
            profile.name || email.split("@")[0] || "Usuario MWC",
          ),
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

      if (account?.provider === "google") {
        const cookieStore = await cookies();
        const intentValue = cookieStore.get(GOOGLE_AUTH_INTENT_COOKIE)?.value;
        const existingAcceptance = dbUser
          ? await db.termsAcceptance.findFirst({
              where: { userId: dbUser.id },
              select: { id: true },
            })
          : null;

        if (!existingAcceptance) {
          const consent = readGoogleRegistrationConsent(
            cookieStore.get(GOOGLE_REGISTRATION_COOKIE)?.value,
          );
          if (!consent) {
            return getGoogleTermsRegistrationPath(intentValue);
          }

          // Dependendo do momento do callback OAuth, o adapter pode ainda nao
          // ter criado o usuario. Nesse caso, o evento createUser persiste o
          // aceite logo depois da criacao da conta.
          if (dbUser) {
            const acceptedNow = await persistGoogleTermsAcceptance(
              dbUser.id,
              consent,
            );
            cookieStore.delete(GOOGLE_REGISTRATION_COOKIE);

            if (acceptedNow) {
              try {
                await sendWelcomeEmail({
                  userId: dbUser.id,
                  email: user.email ?? null,
                  name: user.name ?? null,
                  userType: dbUser.userType,
                  industry: dbUser.industry,
                });
              } catch (error) {
                console.error("Failed to send welcome email:", error);
              }
            }
          }
        }

        if (existingAcceptance) {
          cookieStore.delete(GOOGLE_REGISTRATION_COOKIE);
        }

        if (existingAcceptance || dbUser) {
          cookieStore.delete(GOOGLE_AUTH_INTENT_COOKIE);
        }
      }

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
      if (!user.id) return;

      const cookieStore = await cookies();
      const consent = readGoogleRegistrationConsent(
        cookieStore.get(GOOGLE_REGISTRATION_COOKIE)?.value,
      );

      // Uma conta OAuth pode ser materializada pelo adapter antes do callback
      // signIn. Sem aceite valido ela permanece sem acesso e sem e-mail de
      // boas-vindas; o callback redireciona o usuario para concluir o cadastro.
      if (!consent) return;

      await persistGoogleTermsAcceptance(user.id, consent);
      cookieStore.delete(GOOGLE_REGISTRATION_COOKIE);
      cookieStore.delete(GOOGLE_AUTH_INTENT_COOKIE);

      try {
        const dbUser = await getAuthUserFields(user.id, user.email);
        await sendWelcomeEmail({
          userId: user.id,
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
