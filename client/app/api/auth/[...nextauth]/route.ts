import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { adminDb } from "@/lib/firebaseAdmin";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    async jwt({ token, trigger }) {
      if (trigger === "signIn" || trigger === "signUp") {
        const doc = await adminDb
          .collection("config")
          .doc("allowedEmails")
          .get();
        const emails: string[] = doc.data()?.emails ?? [];
        token.isAdmin = emails.includes(token.email ?? "");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.isAdmin = token.isAdmin ?? false;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
