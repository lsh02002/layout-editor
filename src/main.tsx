import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import App from "./components/layout/LayoutEditor";
import { LoginProvider } from "./context/LoginContext";
import { ModalProvider } from "./context/ModalContext";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <LoginProvider>
    <ModalProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ModalProvider>
  </LoginProvider>,
);
