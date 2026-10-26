import { useSearchParams } from "react-router-dom";
import Header from "../../components/Header";
import Pagination from "../../components/Pagination";
import Toast from "../contract/components/Toast";
import { FADE_IN_STYLE } from "../transaction/styles";
import CancelMovementModal from "./components/CancelMovementModal";
import InventoryToolbar from "./components/InventoryToolbar";
import ItemStockTable from "./components/ItemStockTable";
import MovementFormModal from "./components/MovementFormModal";
import MovementList from "./components/MovementList";
import MovementToolbar from "./components/MovementToolbar";
import PeriodTradeTable from "./components/PeriodTradeTable";
import PeriodTradeToolbar from "./components/PeriodTradeToolbar";
import StockSheet from "./components/StockSheet";
import UnmappedWarning from "./components/UnmappedWarning";
import { useInventoryMovements } from "./hooks/useInventoryMovements";
import { useInventoryPeriodTrades } from "./hooks/useInventoryPeriodTrades";
import { useInventoryStock } from "./hooks/useInventoryStock";

const TABS = [
  { key: "stock", label: "재고 현황" },
  { key: "movements", label: "보정 내역" },
  { key: "period", label: "기간 통계" },
];

function StatusBox({ loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        재고 현황을 불러오는 중입니다.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center shadow-sm">
      <p className="text-sm text-red-600">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
      >
        다시 시도
      </button>
    </div>
  );
}

// 재고 현황 탭 — 엑셀 재고 현황표 + 품목별 재고(이동·증감·재고 확인)
function StockTab() {
  const { toolbar, status, unmapped, sheet, itemTable, actions, movementModal, toast } = useInventoryStock();
  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={actions.onOpenAdjustment}
          className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
        >
          재고 증감
        </button>
        <button
          type="button"
          onClick={actions.onOpenTransfer}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
        >
          품목 간 이동
        </button>
      </div>
      <InventoryToolbar {...toolbar} />
      {status.loading || status.error ? (
        <StatusBox {...status} />
      ) : (
        <>
          <UnmappedWarning {...unmapped} />
          <StockSheet {...sheet} />
          <ItemStockTable {...itemTable} />
        </>
      )}
      <MovementFormModal {...movementModal} />
      <Toast toast={toast} />
    </>
  );
}

// 보정 내역 탭 — 조회·취소
function MovementsTab() {
  const { toolbar, list, pagination, cancelModal, toast } = useInventoryMovements();
  return (
    <>
      <MovementToolbar {...toolbar} />
      <MovementList {...list} />
      <Pagination {...pagination} />
      <CancelMovementModal {...cancelModal} />
      <Toast toast={toast} />
    </>
  );
}

// 기간 통계 탭 — 기간·자사·거래처·품목별 매입/매출 수량과 평균 단가
function PeriodTradesTab() {
  const { toolbar, unmapped, table } = useInventoryPeriodTrades();
  return (
    <>
      <PeriodTradeToolbar {...toolbar} />
      <UnmappedWarning {...unmapped} />
      <PeriodTradeTable {...table} />
    </>
  );
}

// 재고관리 화면 — 탭은 ?tab=movements / ?tab=period 로 구분해 새로고침해도 유지한다
export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = TABS.some((tab) => tab.key === tabParam) ? tabParam : "stock";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      {/* 재고 현황표는 품목 열이 많아 다른 화면보다 넓게 쓴다 */}
      <main className="mx-auto max-w-[100rem] space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">재고 관리</h1>
          <p className="mt-1 text-sm text-slate-500">
            원본 계근데이터 기준으로 기준일까지 누적된 품목별 재고와 그날의 입출고·보정을 확인합니다.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams(tab.key === "stock" ? {} : { tab: tab.key }, { replace: true })}
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

        {activeTab === "stock" && <StockTab />}
        {activeTab === "movements" && <MovementsTab />}
        {activeTab === "period" && <PeriodTradesTab />}
      </main>
      <style>{FADE_IN_STYLE}</style>
    </div>
  );
}
