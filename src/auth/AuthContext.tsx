import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "../api/types";
import { useAuthLogic } from "./useAuthLogic";

type AuthContextValue = {
  status: "loading" | "loggedIn" | "loggedOut";
  user: User | null;
  accounts: { user: User; token: string }[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchAccount: (userId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthLogic();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
