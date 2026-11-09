import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Toast from "../contract/components/Toast";
import MergeModal from "./components/MergeModal";
import TransactionDetailModal from "./components/TransactionDetailModal";
import TransactionList from "./components/TransactionList";
import TransactionToolbar from "./components/TransactionToolbar";
import { useTransactionList } from "./hooks/useTransactionList";

export default function TransactionListPage() {
  const { toolbar, actions, list, pagination, mergeModal, detailModal, toast } = useTransactionList();

  return (
    <>
      <PageContainer>
        <PageHeader
          title="거래 관리"
          description="계근·수기 거래를 확인합니다. 미매핑 계근도 모두 포함되며, 행을 누르면 상세를 엽니다."
          actions={
            <>
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
            </>
          }
        />

        <TransactionToolbar {...toolbar} />
        <TransactionList {...list} />
        <Pagination {...pagination} />
      </PageContainer>

      <MergeModal {...mergeModal} />
      <TransactionDetailModal {...detailModal} />
      <Toast toast={toast} />
    </>
  );
}
