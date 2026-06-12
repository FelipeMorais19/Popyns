import { clerkMiddleware } from "@clerk/nextjs/server";

// clockSkewInMs: tolera desvio de até 5min entre o relógio local e tokens Clerk.
// Necessário quando o NTP do Windows está desincronizado.
export default clerkMiddleware(
  async () => {},
  { clockSkewInMs: 300_000 },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/__clerk/(.*)",
    "/(api|trpc)(.*)",
  ],
};
