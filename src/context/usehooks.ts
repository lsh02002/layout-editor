import { createContext, useContext } from "react";
import type { LoginContextValue } from "./LoginContext";
import type { ModalManagerContextValue } from "./ModalContext";
import type { EditorConfig } from "../components/editor/registry/componentRegistry";

export const LoginContext = createContext<LoginContextValue | undefined>(
  undefined,
);

export function useLogin() {
  const ctx = useContext(LoginContext);

  if (!ctx) throw new Error("useLogin must be used within <LoginProvider>");
  return ctx;
}

export const ModalManagerContext =
  createContext<ModalManagerContextValue | null>(null);

export function useModalManager() {
  const context = useContext(ModalManagerContext);

  if (!context) {
    throw new Error("useModalManager must be used inside <ModalProvider>");
  }

  return context;
}

export const EditorConfigContext = createContext<EditorConfig | null>(null);

export function useEditorConfig() {
  const context = useContext(EditorConfigContext);

  if (!context) {
    throw new Error("EditorConfigProvider is missing");
  }

  return context;
}
