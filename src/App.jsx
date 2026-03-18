import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PriceManagement from "./pages/PriceManagement";
import LmePage from "./pages/LmePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PriceManagement />} />
        <Route path="/lme" element={<LmePage />} />
      </Routes>
    </BrowserRouter>
  );
}