import { Route, Routes } from "react-router-dom";
import LayoutEditor from "./components/editor/LayoutEditor";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LayoutEditor />} />
    </Routes>
  );
};

export default App;
