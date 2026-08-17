import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "./App";
import { LoginProvider } from "./context/LoginContext";
import { ModalProvider } from "./context/ModalContext";

createRoot(document.getElementById("root")!).render(
  <LoginProvider>
    <ModalProvider>      
      <App />
    </ModalProvider>
  </LoginProvider>,
);
