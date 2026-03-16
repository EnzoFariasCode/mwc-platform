import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/prisma";

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

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

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          userType: user.userType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.userType || "CLIENT";
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "CLIENT" | "PROFESSIONAL" | "ADMIN";
      }
      return session;
    },
  },
  events: {
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
