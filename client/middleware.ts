import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ token }) {
      return token?.isAdmin === true;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*"],
};
