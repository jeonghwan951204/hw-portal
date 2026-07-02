import { BrowserRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";
import SignupPage from "./pages/SignupPage";
import PriceManagement from "./pages/priceManagement";
import LmePage from "./pages/price";
import NoticePage from "./pages/NoticePage";
import InventoryPage from "./pages/InventoryPage";
import WeighingPage from "./pages/WeighingPage";
import DocumentsPage from "./pages/DocumentsPage";
import ContractPage from "./pages/contract";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지는 더 이상 사용하지 않음 (공유링크 가입으로 대체) */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup/:linkId" element={<SignupPage />} />

        {/* 보호된 페이지 — 토큰 + 권한 필요 */}
        <Route path="/" element={<RequireAuth roles={["USER", "ADMIN"]}><PriceManagement /></RequireAuth>} />
        <Route path="/lme" element={<RequireAuth roles={["USER", "ADMIN"]}><LmePage /></RequireAuth>} />
        <Route path="/notice" element={<RequireAuth roles={["USER", "ADMIN"]}><NoticePage /></RequireAuth>} />
        <Route path="/inventory" element={<RequireAuth roles={["USER", "ADMIN"]}><InventoryPage /></RequireAuth>} />
        <Route path="/weighing" element={<RequireAuth roles={["USER", "ADMIN"]}><WeighingPage /></RequireAuth>} />
        <Route path="/documents" element={<RequireAuth roles={["USER", "ADMIN"]}><DocumentsPage /></RequireAuth>} />
        <Route path="/contract" element={<RequireAuth roles={["USER", "ADMIN"]}><ContractPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
