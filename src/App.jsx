import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import PriceManagement from "./pages/PriceManagement";
import LmePage from "./pages/LmePage";
import NoticePage from "./pages/NoticePage";
import InventoryPage from "./pages/InventoryPage";
import WeighingPage from "./pages/WeighingPage";
import DocumentsPage from "./pages/DocumentsPage";
import ContractPage from "./pages/ContractPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PriceManagement />} />
        <Route path="/lme" element={<LmePage />} />
        <Route path="/notice" element={<NoticePage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/weighing" element={<WeighingPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/contract" element={<ContractPage />} />
      </Routes>
    </BrowserRouter>
  );
}
