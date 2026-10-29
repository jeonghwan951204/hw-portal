import { BrowserRouter, Routes, Route } from "react-router-dom";
import KakaoInAppBrowserGuard from "./components/KakaoInAppBrowserGuard";
import RequireAuth from "./components/RequireAuth";
import AppLayout from "./components/AppLayout";
import SignupPage from "./pages/SignupPage";
import PriceManagement from "./pages/priceManagement";
import LmePage from "./pages/price";
import NoticePage from "./pages/NoticePage";
import InventoryPage from "./pages/inventory";
import WeighingPage from "./pages/weighing";
import CompaniesPage from "./pages/companies";
import CompanyFormPage from "./pages/companies/form";
import ItemsPage from "./pages/items";
import DocumentsPage from "./pages/DocumentsPage";
import ContractListPage from "./pages/contract";
import ContractDetailPage from "./pages/contract/detail";
import ContractFormPage from "./pages/contract/form";
import AdminPage from "./pages/admin";
import DiscordMessagePage from "./pages/discordMessage";
import DiscordMessageFormPage from "./pages/discordMessage/form";
import TransactionListPage from "./pages/transaction";
import TransactionRegisterPage from "./pages/transaction/form";

export default function App() {
  return (
    <KakaoInAppBrowserGuard>
      <BrowserRouter>
        <Routes>
          {/* 로그인 페이지는 더 이상 사용하지 않음 (공유링크 가입으로 대체) */}
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/signup/:linkId" element={<SignupPage />} />

          {/* 보호된 페이지 — 토큰 + 권한 필요. 공통 사이드바 레이아웃 안에서 렌더링한다 */}
          <Route element={<RequireAuth roles={["USER", "ADMIN"]}><AppLayout /></RequireAuth>}>
            <Route path="/" element={<PriceManagement />} />
            <Route path="/lme" element={<LmePage />} />
            <Route path="/notice" element={<NoticePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/weighing" element={<WeighingPage />} />
            <Route path="/transactions" element={<TransactionListPage />} />
            <Route path="/transactions/new" element={<TransactionRegisterPage />} />
            <Route path="/companies" element={<CompaniesPage />} />
            <Route path="/companies/new" element={<CompanyFormPage />} />
            <Route path="/companies/:id/edit" element={<CompanyFormPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/contract" element={<ContractListPage />} />
            <Route path="/contract/new" element={<ContractFormPage />} />
            <Route path="/contract/:id" element={<ContractDetailPage />} />
            <Route path="/contract/:id/edit" element={<ContractFormPage />} />
            <Route path="/admin" element={<RequireAuth roles={["ADMIN"]}><AdminPage /></RequireAuth>} />
            <Route path="/admin/discord-messages" element={<RequireAuth roles={["ADMIN"]}><DiscordMessagePage /></RequireAuth>} />
            <Route path="/admin/discord-messages/new" element={<RequireAuth roles={["ADMIN"]}><DiscordMessageFormPage /></RequireAuth>} />
            <Route path="/admin/discord-messages/:id/edit" element={<RequireAuth roles={["ADMIN"]}><DiscordMessageFormPage /></RequireAuth>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </KakaoInAppBrowserGuard>
  );
}
