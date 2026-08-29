import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ModalManagerContext } from "./usehooks";
type ModalName = string;

export type ModalManagerContextValue = {
  openModals: ModalName[];
  topModal: ModalName | null;
  isOpen: (name: ModalName) => boolean;

  hasOpenModal: boolean; // ✅ 추가

  openModal: (name: ModalName) => void;
  closeTopModal: () => void;
  closeModal: (name: ModalName) => void;
  closeAllModals: () => void;
};

export function ModalProvider({ children }: { children: React.ReactNode }) {
  // const { isSideOpen, setIsSideOpen } = useLogin();
  const [openModals, setOpenModals] = useState<ModalName[]>([]);
  const stackRef = useRef<ModalName[]>([]);
  const isHandlingPopRef = useRef(false);

  const syncStack = useCallback((nextStack: ModalName[]) => {
    stackRef.current = nextStack;
    setOpenModals(nextStack);
  }, []);

  const openModal = useCallback((name: ModalName) => {
    const nextStack = [...stackRef.current, name];

    stackRef.current = nextStack;
    setOpenModals(nextStack);

    window.history.pushState({ modal: name }, "");
  }, []);

  const closeTopModal = useCallback(() => {
    if (stackRef.current.length === 0) return;

    if (window.history.state?.modal) {
      window.history.back();
      return;
    }

    const nextStack = stackRef.current.slice(0, -1);
    syncStack(nextStack);
  }, [syncStack]);

  const closeModal = useCallback((name: ModalName) => {
    const top = stackRef.current.at(-1);

    if (top !== name) return;

    window.history.back();
  }, []);

  const closeAllModals = useCallback(() => {
    // if (isSideOpen) {
    //   setIsSideOpen(false);
    // }

    const count = stackRef.current.length;
    if (count === 0) return;

    syncStack([]);

    // history도 쌓인 만큼 뒤로 이동
    window.history.go(-count);
  }, [syncStack]);

  useEffect(() => {
    const handlePopState = () => {
      // const closedModal = stackRef.current.at(-1);

      isHandlingPopRef.current = true;

      // if (closedModal === "side") {
      //   if (isSideOpen) {
      //     setIsSideOpen(false);
      //   }
      // }

      const nextStack = stackRef.current.slice(0, -1);
      syncStack(nextStack);

      queueMicrotask(() => {
        isHandlingPopRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncStack]);

  const value = useMemo<ModalManagerContextValue>(() => {
    const topModal = openModals.at(-1) ?? null;

    return {
      openModals,
      topModal,
      isOpen: (name) => openModals.includes(name),

      hasOpenModal: openModals.length > 0,

      openModal,
      closeTopModal,
      closeModal,
      closeAllModals,
    };
  }, [openModals, openModal, closeTopModal, closeModal, closeAllModals]);

  return (
    <ModalManagerContext.Provider value={value}>
      {children}
    </ModalManagerContext.Provider>
  );
}
