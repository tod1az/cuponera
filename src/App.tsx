import { useConvexAuth } from "convex/react";
import { Login } from "./components/Login";
import { Inicio } from "./components/Inicio";

export default function App() {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-borde border-t-acento" />
      </div>
    );
  }
  return isAuthenticated ? <Inicio /> : <Login />;
}
