import ContractDetailHeader from "./components/ContractDetailHeader";
import PriceInfoTab from "./components/PriceInfoTab";
import TransactionTab from "./components/TransactionTab";
import Button from "../../components/Button";
import ConfirmModal from "../../components/ConfirmModal";
import PageContainer from "../../components/PageContainer";
import Tabs from "../../components/Tabs";
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
  const {
    loading,
    contract,
    header,
    tabs,
    priceTab,
    txTab,
    deleteModal,
    transactionDeleteModal,
    toast,
  } = useContractDetail();

  return (
    <>
      <PageContainer>
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
            <Button className="mt-4" onClick={() => navigate("/contract")}>
              목록으로
            </Button>
          </div>
        ) : (
          <>
            <ContractDetailHeader {...header} />

            <Tabs tabs={TABS} active={tabs.activeTab} onChange={tabs.onTabChange} />

            {tabs.activeTab === "price" ? (
              <PriceInfoTab {...priceTab} />
            ) : (
              <TransactionTab {...txTab} />
            )}
          </>
        )}
      </PageContainer>

      <ConfirmModal
        open={deleteModal.open}
        title="계약 삭제"
        message="삭제하시겠습니까?"
        danger
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
      />
      <ConfirmModal
        open={transactionDeleteModal.open}
        title="거래 내역 삭제"
        message="선택한 거래 내역을 삭제하시겠습니까?"
        confirmLabel="삭제"
        danger
        onConfirm={transactionDeleteModal.onConfirm}
        onCancel={transactionDeleteModal.onCancel}
      />
      <Toast toast={toast} />
    </>
  );
}
