import { withAuth } from "next-auth/middleware";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export default withAuth({
  callbacks: {
    authorized({ token }) {
      if (!token?.email) return false;
      return allowedEmails.includes(token.email);
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
