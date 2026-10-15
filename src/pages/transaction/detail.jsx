import Header from "../../components/Header";
import ConfirmModal from "../contract/components/ConfirmModal";
import Toast from "../contract/components/Toast";
import HistorySection from "./components/HistorySection";
import ManualItemTable from "./components/ManualItemTable";
import PaymentCard from "./components/PaymentCard";
import TransactionDetailHeader from "./components/TransactionDetailHeader";
import {
  CancelConfirmationModal,
  ConfirmTransactionModal,
  MoveModal,
  SplitModal,
} from "./components/TransactionModals";
import TransactionSummary from "./components/TransactionSummary";
import WeighingRecordTable from "./components/WeighingRecordTable";
import { useTransactionDetail } from "./hooks/useTransactionDetail";
import { FADE_IN_STYLE } from "./styles";

// 거래 상세 — 공통정보·합계·경고·결제 + 계근 거래면 포함 계근, 수기 거래면 수기 품목
export default function TransactionDetailPage() {
  const {
    loading,
    loadError,
    detail,
    onBack,
    onReload,
    header,
    summary,
    warnings,
    payment,
    records,
    manualItems,
    history,
    confirmModal,
    cancelModal,
    splitModal,
    moveModal,
    deleteItemModal,
    toast,
  } = useTransactionDetail();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <button type="button" onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          ← 거래 목록
        </button>

        {loading && !detail ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
            거래를 불러오는 중입니다.
          </div>
        ) : !detail ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-sm">
            <p className={`text-sm ${loadError ? "text-red-600" : "text-slate-400"}`}>{loadError || "거래를 찾을 수 없습니다."}</p>
            <div className="mt-4 flex justify-center gap-2">
              {loadError && (
                <button type="button" onClick={onReload} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  다시 시도
                </button>
              )}
              <button type="button" onClick={onBack} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                목록으로
              </button>
            </div>
          </div>
        ) : (
          <>
            <TransactionDetailHeader {...header} />
            <TransactionSummary summary={summary} warnings={warnings} />
            <PaymentCard {...payment} />
            {records && <WeighingRecordTable {...records} />}
            {manualItems && <ManualItemTable {...manualItems} />}
            <HistorySection {...history} />
          </>
        )}
      </main>

      <ConfirmTransactionModal {...confirmModal} />
      <CancelConfirmationModal {...cancelModal} />
      <SplitModal {...splitModal} />
      <MoveModal {...moveModal} />
      <ConfirmModal
        open={deleteItemModal.open}
        title="품목 삭제"
        message="선택한 수기 품목을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={deleteItemModal.onConfirm}
        onCancel={deleteItemModal.onCancel}
      />
      <Toast toast={toast} />
      <style>{FADE_IN_STYLE}</style>
    </div>
  );
}
