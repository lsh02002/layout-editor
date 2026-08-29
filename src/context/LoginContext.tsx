import {
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { LoginContext } from "../usehooks/usehooks";
import type { EditTab } from "../components/editor/hooks/useEditComponentForm";

export type LoginContextValue = {
  isLogin: boolean;
  setIsLogin: Dispatch<SetStateAction<boolean>>;
  editTab: EditTab;
  setEditTab: React.Dispatch<React.SetStateAction<EditTab>>;
  resetLoginContext: () => void;
};

export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [isLogin, setIsLogin] = useState(false);
  const [editTab, setEditTab] = useState<EditTab>("basic");

  const resetLoginContext = () => {
    setIsLogin(false);
  };

  const value: LoginContextValue = {
    isLogin,
    setIsLogin,
    editTab,
    setEditTab,
    resetLoginContext,
  };

  return (
    <LoginContext.Provider value={value}>{children}</LoginContext.Provider>
  );
};
