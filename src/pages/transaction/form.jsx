import { useSearchParams } from "react-router-dom";
import Pagination from "../../components/Pagination";
import Toast from "../contract/components/Toast";
import ManualRegisterForm from "./components/ManualRegisterForm";
import RegisterConfirmModal from "./components/RegisterConfirmModal";
import RegisteredTransactionList from "./components/RegisteredTransactionList";
import TransactionDetailModal from "./components/TransactionDetailModal";
import UnassignedRecordList from "./components/UnassignedRecordList";
import UnassignedRecordToolbar from "./components/UnassignedRecordToolbar";
import { useManualTransactionForm } from "./hooks/useManualTransactionForm";
import { useWeighingRegister } from "./hooks/useWeighingRegister";
import { FADE_IN_STYLE } from "./styles";

const TABS = [
  { key: "weighing", label: "계근 선택 등록" },
  { key: "manual", label: "수기 등록" },
];

function SelectionBar({ count, blocker, onClear, onOpenConfirm }) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
      <span className="mr-auto text-sm text-slate-600">
        선택 <b className="text-blue-600">{count}</b>건
        {blocker && <span className="ml-2 text-xs text-red-500">{blocker}</span>}
      </span>
      {count > 0 && (
        <button type="button" onClick={onClear} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
          선택 해제
        </button>
      )}
      <button
        type="button"
        onClick={onOpenConfirm}
        disabled={count === 0 || Boolean(blocker)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        선택 계근으로 거래 등록
      </button>
    </div>
  );
}

// 계근 선택 등록 탭 — 미배정 계근을 조회·선택해 하나의 거래로 묶는다
function WeighingRegisterTab() {
  const { toolbar, list, pagination, selectionBar, confirmModal, registeredList, detailModal, toast } = useWeighingRegister();
  return (
    <>
      <RegisteredTransactionList {...registeredList} />
      <UnassignedRecordToolbar {...toolbar} />
      <UnassignedRecordList {...list} />
      <Pagination {...pagination} />
      <SelectionBar {...selectionBar} />
      <RegisterConfirmModal {...confirmModal} />
      <TransactionDetailModal {...detailModal} />
      <Toast toast={toast} />
    </>
  );
}

// 수기 등록 탭 — 계근 없이 직접 입력
function ManualRegisterTab() {
  const { header, itemRows, submitBar, toast } = useManualTransactionForm();
  return (
    <>
      <ManualRegisterForm header={header} itemRows={itemRows} submitBar={submitBar} />
      <Toast toast={toast} />
    </>
  );
}

// 거래 등록 화면 — 탭은 ?tab=manual 로 구분해 새로고침해도 유지한다
export default function TransactionRegisterPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "manual" ? "manual" : "weighing";

  return (
    <div className="text-slate-900">
      <main className="mx-auto max-w-[100rem] space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">거래 등록</h1>
          <p className="mt-1 text-sm text-slate-500">거래에 묶이지 않은 계근을 골라 거래로 등록하거나, 계근 없이 수기로 등록합니다.</p>
        </div>

        <div className="flex items-center gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSearchParams(tab.key === "weighing" ? {} : { tab: tab.key }, { replace: true })}
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

        {activeTab === "weighing" ? <WeighingRegisterTab /> : <ManualRegisterTab />}
      </main>
      <style>{FADE_IN_STYLE}</style>
    </div>
  );
}
