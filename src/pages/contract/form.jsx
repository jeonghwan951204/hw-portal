import FormStepIndicator from "./components/FormStepIndicator";
import FormStepBasic from "./components/FormStepBasic";
import FormStepPrices from "./components/FormStepPrices";
import FormStepItems from "./components/FormStepItems";
import FormStepConfirm from "./components/FormStepConfirm";
import Button from "../../components/Button";
import ConfirmModal from "../../components/ConfirmModal";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Toast from "./components/Toast";
import { useContractForm } from "./hooks/useContractForm";

// 계약 등록/수정 화면 — 스텝형 (1 기본 → 2 단가 → 3 품목 → 4 확인)
export default function ContractFormPage() {
  const {
    isEdit,
    stepper,
    nav,
    basicStep,
    pricesStep,
    itemsStep,
    confirmStep,
    saveModal,
    toast,
  } = useContractForm();

  return (
    <>
      <PageContainer width="narrow">
        <PageHeader
          title={isEdit ? "계약 수정" : "계약 등록"}
          description={
            isEdit
              ? "계약 기본 정보(헤더)만 수정합니다. 단가·품목은 별도로 관리됩니다."
              : "기본 정보 → 단가 → 품목 순서로 입력한 뒤 확인하고 등록합니다."
          }
        />

        {isEdit ? (
          // 수정 모드 — 헤더만 수정 (PUT). 단일 단계
          <>
            <FormStepBasic {...basicStep} />
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={nav.onCancel}>
                취소
              </Button>
              <Button onClick={nav.onSave}>저장</Button>
            </div>
          </>
        ) : (
          // 등록 모드 — 스텝형
          <>
            <FormStepIndicator {...stepper} />

            {nav.step === 1 && <FormStepBasic {...basicStep} />}
            {nav.step === 2 && <FormStepPrices {...pricesStep} />}
            {nav.step === 3 && <FormStepItems {...itemsStep} />}
            {nav.step === 4 && <FormStepConfirm {...confirmStep} />}

            {/* 이전 / 취소 / 다음·등록 */}
            <div className="flex items-center justify-between">
              {nav.step > 1 ? (
                <Button variant="secondary" onClick={nav.onPrev}>
                  이전
                </Button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={nav.onCancel}>
                  취소
                </Button>
                {nav.step < nav.totalSteps ? (
                  <Button onClick={nav.onNext}>다음</Button>
                ) : (
                  <Button onClick={nav.onSave}>등록</Button>
                )}
              </div>
            </div>
          </>
        )}
      </PageContainer>

      <ConfirmModal
        open={saveModal.open}
        title={isEdit ? "계약 수정" : "계약 등록"}
        message="저장하시겠습니까?"
        onConfirm={saveModal.onConfirm}
        onCancel={saveModal.onCancel}
      />
      <Toast toast={toast} />
    </>
  );
}
