import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (allowedEmails.length === 0) return false;
      return allowedEmails.includes(user.email ?? "");
    },
  },
  pages: {
    error: "/api/auth/signin",
  },
});

export { handler as GET, handler as POST };
