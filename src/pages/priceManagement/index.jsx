import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import CategoryTabs from "./components/CategoryTabs";
import PriceInputTable from "./components/PriceInputTable";
import PriceHistorySection from "./components/PriceHistorySection";
import { usePriceManagement } from "./hooks/usePriceManagement";

export default function PriceManagement() {
  const { category, handleCategoryChange, input, history } = usePriceManagement();

  return (
    <PageContainer>
      <PageHeader title="사이트 관리" description="카테고리별 가격을 입력하고 최근 내역을 확인합니다." />

      {/* 카테고리 탭 */}
      <div className="flex">
        <CategoryTabs current={category} onChange={handleCategoryChange} />
      </div>

      {/* 가격 입력 섹션 */}
      <PriceInputTable {...input} />

      {/* 최근 내역 섹션 */}
      <PriceHistorySection {...history} />
    </PageContainer>
  );
}
