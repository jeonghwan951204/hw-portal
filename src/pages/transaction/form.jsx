import { useSearchParams } from "react-router-dom";
import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Tabs from "../../components/Tabs";
import Toast from "../contract/components/Toast";
import ManualRegisterForm from "./components/ManualRegisterForm";
import RegisterConfirmModal from "./components/RegisterConfirmModal";
import RegisteredTransactionList from "./components/RegisteredTransactionList";
import TransactionDetailModal from "./components/TransactionDetailModal";
import UnassignedRecordList from "./components/UnassignedRecordList";
import UnassignedRecordToolbar from "./components/UnassignedRecordToolbar";
import { useManualTransactionForm } from "./hooks/useManualTransactionForm";
import { useWeighingRegister } from "./hooks/useWeighingRegister";

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
        <Button variant="secondary" onClick={onClear}>
          선택 해제
        </Button>
      )}
      <Button onClick={onOpenConfirm} disabled={count === 0 || Boolean(blocker)}>
        선택 계근으로 거래 등록
      </Button>
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
    <PageContainer>
      <PageHeader
        title="거래 등록"
        description="거래에 묶이지 않은 계근을 골라 거래로 등록하거나, 계근 없이 수기로 등록합니다."
      />

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={(key) => setSearchParams(key === "weighing" ? {} : { tab: key }, { replace: true })}
      />

      {activeTab === "weighing" ? <WeighingRegisterTab /> : <ManualRegisterTab />}
    </PageContainer>
  );
}
