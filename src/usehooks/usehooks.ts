import { createContext, useContext } from "react";
import type { LoginContextValue } from "../context/LoginContext";
import type { ModalManagerContextValue } from "../context/ModalContext";

export const LoginContext = createContext<LoginContextValue | undefined>(
  undefined,
);

export function useLogin() {
  const ctx = useContext(LoginContext);

  if (!ctx) throw new Error("useLogin must be used within <LoginProvider>");
  return ctx;
}

export const ModalManagerContext = createContext<ModalManagerContextValue | null>(
  null,
);

export function useModalManager() {
  const context = useContext(ModalManagerContext);

  if (!context) {
    throw new Error("useModalManager must be used inside <ModalProvider>");
  }

  return context;
}
