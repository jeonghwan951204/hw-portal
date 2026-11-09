import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import WeighingList from "./components/WeighingList";
import WeighingToolbar from "./components/WeighingToolbar";
import { useWeighingList } from "./hooks/useWeighingList";

export default function WeighingPage() {
  const { toolbar, list, pagination } = useWeighingList();

  return (
    <PageContainer>
      <PageHeader title="계근 조회" description="계량 내역을 조회하고 행을 눌러 상세정보를 확인합니다." />

      <WeighingToolbar {...toolbar} />
      <WeighingList {...list} />
      <Pagination {...pagination} />
    </PageContainer>
  );
}
