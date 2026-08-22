import { Route, Routes } from "react-router-dom";
import LayoutEditor from "./components/layout/LayoutEditor";

const App = () => {
  return (    
      <Routes>
        <Route path="/" element={<LayoutEditor />} />
      </Routes>    
  );
};

export default App;
