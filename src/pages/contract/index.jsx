import { useState } from "react";
import Header from "../../components/Header";
import Pagination from "../../components/Pagination";
import AllTransactionsTab from "./components/AllTransactionsTab";
import MarketBanner from "./components/MarketBanner";
import ContractToolbar from "./components/ContractToolbar";
import ContractGrid from "./components/ContractGrid";
import Toast from "./components/Toast";
import { useAllTransactions } from "./hooks/useAllTransactions";
import { useContractList } from "./hooks/useContractList";

const TABS = [
  { key: "contracts", label: "계약 목록" },
  { key: "transactions", label: "전체 거래내역" },
];

// 계약 목록 화면
export default function ContractListPage() {
  const [activeTab, setActiveTab] = useState("contracts");
  const { market, toolbar, list, pagination, toast } = useContractList();
  const allTransactions = useAllTransactions(activeTab === "transactions");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <MarketBanner {...market} />

        <div className="flex items-center gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "contracts" ? (
          <>
            <ContractToolbar {...toolbar} />
            <ContractGrid {...list} />
            <Pagination {...pagination} />
          </>
        ) : (
          <AllTransactionsTab {...allTransactions} />
        )}
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
