import { useState } from "react";
import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import WeighingList from "./components/WeighingList";
import WeighingSyncRequestModal from "./components/WeighingSyncRequestModal";
import WeighingToolbar from "./components/WeighingToolbar";
import { useWeighingList } from "./hooks/useWeighingList";

export default function WeighingPage() {
  const [syncRequestOpen, setSyncRequestOpen] = useState(false);
  const { toolbar, list, pagination } = useWeighingList();

  const closeSyncRequest = () => {
    setSyncRequestOpen(false);
    list.onRetry();
  };

  return (
    <PageContainer>
      <div className="space-y-5" inert={syncRequestOpen}>
        <PageHeader
          title="계근 조회"
          description="계량 내역을 조회하고 행을 눌러 상세정보를 확인합니다."
          actions={<Button variant="outline" onClick={() => setSyncRequestOpen(true)}>기간 다시 동기화</Button>}
        />

        <WeighingToolbar {...toolbar} />
        <WeighingList {...list} />
        <Pagination {...pagination} />
      </div>
      {syncRequestOpen && <WeighingSyncRequestModal onClose={closeSyncRequest} />}
    </PageContainer>
  );
}
