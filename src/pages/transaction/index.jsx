import { useSearchParams } from "react-router-dom";
import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Tabs from "../../components/Tabs";
import Toast from "../contract/components/Toast";
import MergeModal from "./components/MergeModal";
import PaymentStatusTab from "./components/PaymentStatusTab";
import TransactionDetailModal from "./components/TransactionDetailModal";
import TransactionList from "./components/TransactionList";
import TransactionToolbar from "./components/TransactionToolbar";
import { useTransactionList } from "./hooks/useTransactionList";

const TABS = [
  { key: "list", label: "거래 내역" },
  { key: "payment-status", label: "결제 현황" },
];

function TransactionListTab() {
  const { toolbar, actions, list, pagination, mergeModal, detailModal, toast } = useTransactionList();
  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {actions.selectedCount > 0 && (
          <Button variant="ghost" onClick={actions.onClearSelection}>
            선택 해제 ({actions.selectedCount})
          </Button>
        )}
        <Button
          variant="outline"
          onClick={actions.onOpenMerge}
          disabled={!actions.canMerge}
          title="결제 완료 전 거래를 두 건 이상 선택하세요"
        >
          거래 합치기
        </Button>
        <Button onClick={actions.onCreate}>거래 등록</Button>
      </div>
      <TransactionToolbar {...toolbar} />
      <TransactionList {...list} />
      <Pagination {...pagination} />
      <MergeModal {...mergeModal} />
      <TransactionDetailModal {...detailModal} />
      <Toast toast={toast} />
    </>
  );
}

export default function TransactionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "payment-status" ? "payment-status" : "list";
  const isPaymentStatus = activeTab === "payment-status";

  const changeTab = (key) => {
    if (key === activeTab) return;
    const next = new URLSearchParams(searchParams);
    if (key === "list") next.delete("tab");
    else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  return (
    <PageContainer width={isPaymentStatus ? "expanded" : "wide"}>
      <PageHeader
        title="거래 관리"
        description={isPaymentStatus ? undefined : "계근·수기 거래를 확인합니다. 미매핑 계근도 모두 포함되며, 행을 누르면 상세를 엽니다."}
      />
      <Tabs tabs={TABS} active={activeTab} onChange={changeTab} />
      <div
        role="tabpanel"
        aria-label={activeTab === "list" ? "거래 내역" : "결제 현황"}
        className={activeTab === "list" ? "space-y-5" : "space-y-2"}
      >
        {activeTab === "list" ? <TransactionListTab /> : <PaymentStatusTab />}
      </div>
    </PageContainer>
  );
}
