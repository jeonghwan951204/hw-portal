import Header from "../../components/Header";
import FormStepIndicator from "./components/FormStepIndicator";
import FormStepBasic from "./components/FormStepBasic";
import FormStepPrices from "./components/FormStepPrices";
import FormStepItems from "./components/FormStepItems";
import FormStepConfirm from "./components/FormStepConfirm";
import ConfirmModal from "./components/ConfirmModal";
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="px-1">
          <h1 className="font-bold text-slate-700 text-lg">
            {isEdit ? "계약 수정" : "계약 등록"}
          </h1>
          {isEdit && (
            <p className="mt-1 text-xs text-slate-400">
              계약 기본 정보(헤더)만 수정합니다. 단가·품목은 별도로 관리됩니다.
            </p>
          )}
        </div>

        {isEdit ? (
          // 수정 모드 — 헤더만 수정 (PUT). 단일 단계
          <>
            <FormStepBasic {...basicStep} />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={nav.onCancel}
                className="px-5 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                취소
              </button>
              <button
                type="button"
                onClick={nav.onSave}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-95"
              >
                저장
              </button>
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
                <button
                  type="button"
                  onClick={nav.onPrev}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  이전
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={nav.onCancel}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  취소
                </button>
                {nav.step < nav.totalSteps ? (
                  <button
                    type="button"
                    onClick={nav.onNext}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-95"
                  >
                    다음
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nav.onSave}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 active:scale-95"
                  >
                    등록
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <ConfirmModal
        open={saveModal.open}
        title={isEdit ? "계약 수정" : "계약 등록"}
        message="저장하시겠습니까?"
        onConfirm={saveModal.onConfirm}
        onCancel={saveModal.onCancel}
      />
      <Toast toast={toast} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
