import Header from "../../components/Header";
import CategoryTabs from "./components/CategoryTabs";
import PriceInputTable from "./components/PriceInputTable";
import PriceHistorySection from "./components/PriceHistorySection";
import { usePriceManagement } from "./hooks/usePriceManagement";

export default function PriceManagement() {
  const { category, handleCategoryChange, input, history } = usePriceManagement();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* 카테고리 탭 */}
        <div className="flex">
          <CategoryTabs current={category} onChange={handleCategoryChange} />
        </div>

        {/* 가격 입력 섹션 */}
        <PriceInputTable {...input} />

        {/* 최근 내역 섹션 */}
        <PriceHistorySection {...history} />
      </main>

      {/* 페이드인 애니메이션 */}
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
