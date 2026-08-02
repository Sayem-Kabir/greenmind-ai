import { BrowserRouter, Routes, Route } from "react-router-dom";

import { SimulationProvider } from "./context/SimulationContext";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import DataQuality from "./pages/DataQuality";
import Methodology from "./pages/Methodology";

function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route
              path="/recommendations"
              element={<Recommendations />}
            />
            <Route
              path="/data-quality"
              element={<DataQuality />}
            />
            <Route
              path="/methodology"
              element={<Methodology />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  );
}

export default App;