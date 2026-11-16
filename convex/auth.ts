import { setupConvexAuth } from "@convex-dev/auth/server";
import { setupGoogle } from "@convex-dev/auth/methods/google/server";
import { components, internal } from "./_generated/api";

const auth = setupConvexAuth({ component: components.auth });

export const { signOut, refreshSession, isAuthenticated } = auth;

// Orígenes permitidos para volver después del login, separados por coma.
// Ej: "http://localhost:5173,https://cuponera.vercel.app"
const allowedRedirectOrigins = (
  process.env.ALLOWED_REDIRECT_ORIGINS ?? "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

export const { startSignInWithGoogle, completeSignInWithGoogle } = setupGoogle(
  auth,
  { component: components.authGoogle, allowedRedirectOrigins },
).attachUserCallbacks({ createUser: internal.users.createUserGoogle });
