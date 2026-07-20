import Header from "../../components/Header";
import ContractDetailHeader from "./components/ContractDetailHeader";
import PriceInfoTab from "./components/PriceInfoTab";
import TransactionTab from "./components/TransactionTab";
import ConfirmModal from "./components/ConfirmModal";
import Toast from "./components/Toast";
import { useContractDetail } from "./hooks/useContractDetail";
import { useNavigate } from "react-router-dom";

const TABS = [
  { key: "price", label: "계약·단가" },
  { key: "tx", label: "거래 내역" },
];

// 계약 상세 화면 — 탭 2개 (계약·단가 / 거래 내역)
export default function ContractDetailPage() {
  const navigate = useNavigate();
  const { loading, contract, header, tabs, priceTab, txTab, deleteModal, toast } =
    useContractDetail();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-3 animate-spin opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="font-medium text-sm">로딩중...</p>
          </div>
        ) : !contract ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-center">
            <p className="font-medium">계약을 찾을 수 없습니다.</p>
            <button
              type="button"
              onClick={() => navigate("/contract")}
              className="mt-4 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
            >
              목록으로
            </button>
          </div>
        ) : (
          <>
            <ContractDetailHeader {...header} />

            {/* 탭 */}
            <div className="flex items-center gap-1.5">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => tabs.onTabChange(tab.key)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${
                    tabs.activeTab === tab.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {tabs.activeTab === "price" ? (
              <PriceInfoTab {...priceTab} />
            ) : (
              <TransactionTab {...txTab} />
            )}
          </>
        )}
      </main>

      <ConfirmModal
        open={deleteModal.open}
        title="계약 삭제"
        message="삭제하시겠습니까?"
        danger
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
      />
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
