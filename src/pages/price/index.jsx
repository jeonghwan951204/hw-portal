import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Toast from "../contract/components/Toast";
import AverageCalculator from "./components/AverageCalculator";
import LmeHistorySection from "./components/LmeHistorySection.jsx";
import ExchangeModal from "./components/ExchangeModal.jsx";
import { useLmePage } from "./hooks/useLmePage";

export default function LmePage() {
  const { toast, average, history, rateModal } = useLmePage();

  return (
    <>
      {rateModal.rateModalOpen && (
        <ExchangeModal onClose={() => rateModal.setRateModalOpen(false)} />
      )}

      <PageContainer>
        <PageHeader title="LME 조회" description="기간 평균 단가를 계산하고 LME 구리 가격 내역을 확인합니다." />
        <AverageCalculator {...average} />
        <LmeHistorySection
          {...history}
          onOpenRateModal={() => rateModal.setRateModalOpen(true)}
        />
      </PageContainer>

      <Toast toast={toast} />
    </>
  );
}
