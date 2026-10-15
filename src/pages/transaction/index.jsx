import Header from "../../components/Header";
import Pagination from "../../components/Pagination";
import Toast from "../contract/components/Toast";
import MergeModal from "./components/MergeModal";
import TransactionList from "./components/TransactionList";
import TransactionToolbar from "./components/TransactionToolbar";
import { useTransactionList } from "./hooks/useTransactionList";
import { FADE_IN_STYLE } from "./styles";

export default function TransactionListPage() {
  const { toolbar, actions, list, pagination, mergeModal, toast } = useTransactionList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">거래 관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              계근·수기 거래를 확인합니다. 미매핑 계근도 모두 포함되며, 행을 누르면 상세로 이동합니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions.selectedCount > 0 && (
              <button
                type="button"
                onClick={actions.onClearSelection}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                선택 해제 ({actions.selectedCount})
              </button>
            )}
            <button
              type="button"
              onClick={actions.onOpenMerge}
              disabled={!actions.canMerge}
              title="확인 대기 중인 거래를 두 건 이상 선택하세요"
              className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              거래 합치기
            </button>
            <button
              type="button"
              onClick={actions.onCreateManual}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              수기 거래 등록
            </button>
          </div>
        </div>

        <TransactionToolbar {...toolbar} />
        <TransactionList {...list} />
        <Pagination {...pagination} />
      </main>

      <MergeModal {...mergeModal} />
      <Toast toast={toast} />
      <style>{FADE_IN_STYLE}</style>
    </div>
  );
}
