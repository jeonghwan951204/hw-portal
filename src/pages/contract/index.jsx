import Header from "../../components/Header";
import Pagination from "../../components/Pagination";
import MarketBanner from "./components/MarketBanner";
import ContractToolbar from "./components/ContractToolbar";
import ContractGrid from "./components/ContractGrid";
import Toast from "./components/Toast";
import { useContractList } from "./hooks/useContractList";

// 계약 목록 화면
export default function ContractListPage() {
  const { market, toolbar, list, pagination, toast } = useContractList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <MarketBanner {...market} />
        <ContractToolbar {...toolbar} />
        <ContractGrid {...list} />
        <Pagination {...pagination} />
      </main>

      <Toast toast={toast} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
