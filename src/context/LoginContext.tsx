import {
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { LoginContext } from "../usehooks/usehooks";

export type LoginContextValue = {
  isLogin: boolean;
  setIsLogin: Dispatch<SetStateAction<boolean>>;
  resetLoginContext: () => void;
};

export const LoginProvider = ({ children }: { children: ReactNode }) => {
  const [isLogin, setIsLogin] = useState(false);

  const resetLoginContext = () => {
    setIsLogin(false);
  };

  const value: LoginContextValue = {
    isLogin,
    setIsLogin,
    resetLoginContext,
  };

  return (
    <LoginContext.Provider value={value}>{children}</LoginContext.Provider>
  );
};
