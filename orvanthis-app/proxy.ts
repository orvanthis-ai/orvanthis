import { withAuth } from "next-auth/middleware";

export default withAuth(
  function proxy(req) {
    // Add role checks here later if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard",
    "/workspace",
    "/assistant",
    "/signals",
    "/opportunities",
    "/calendar",
    "/account",
    "/billing",
    "/dev-admin",
    "/prelaunch",
    "/health",
  ],
};