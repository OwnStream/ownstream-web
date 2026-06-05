import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { User } from "../api/types";
import {type AuthStatus, useAuthLogic} from "./useAuthLogic";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  accounts: { user: User; token: string }[];
  retry: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  switchAccount: (userId: string) => Promise<void>;
  removeAccount: (userId: string) => void;
  showSettings: () => boolean;
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
