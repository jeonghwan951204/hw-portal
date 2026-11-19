import { useEffect, useState } from "react";
import { useConfirm } from "../../../hooks/useConfirm";
import { useToast } from "../../contract/hooks/useToast";
import { createTradePlan, deleteTradePlan, fetchPaymentStatus, fetchTradePlans, updateTradePlan } from "../api/transactionApi";
import { useTransactionDetailModal } from "./useTransactionDetailModal";

function useStatusData(fetchData, ownerCompany, revision) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    let current = true;
    fetchData(ownerCompany)
      .then((data) => {
        const result = Array.isArray(data) ? { rows: data } : data;
        if (current) setResult({ ...result, revision, loadedAt: new Date() });
      })
      .catch(() => {
        if (current) setResult({ revision, failed: true });
      });

    return () => {
      current = false;
    };
  }, [fetchData, ownerCompany, revision]);

  return result?.revision === revision ? result : null;
}

export function usePaymentStatus() {
  const [ownerCompany, setOwnerCompany] = useState("");
  const [revision, setRevision] = useState(0);
  const [detailId, setDetailId] = useState(null);
  const [planEditor, setPlanEditor] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(false);
  const [planError, setPlanError] = useState("");
  const { confirm, confirmModal: deletePlanConfirm } = useConfirm();
  const { toast, showToast } = useToast();
  const planBusy = savingPlan || deletingPlan || deletePlanConfirm.open;
  const refresh = () => setRevision((current) => current + 1);
  const payments = useStatusData(fetchPaymentStatus, ownerCompany, revision);
  const plans = useStatusData(fetchTradePlans, ownerCompany, revision);
  const detailModal = useTransactionDetailModal(detailId, refresh);

  const submitPlan = async (event) => {
    if (!planEditor || planBusy) return;
    const { direction, plan } = planEditor;
    const formData = new FormData(event.currentTarget);
    const { ownerCompany: selectedOwner, ...fields } = Object.fromEntries(
      [...formData].map(([key, value]) => [key, value.trim() || null])
    );
    if (!Object.values(fields).some(Boolean)) {
      setPlanError("날짜, 거래처, 수량, 단가, 비고 중 하나 이상 입력해 주세요.");
      return;
    }

    setSavingPlan(true);
    setPlanError("");
    try {
      const body = { ...fields, ownerCompany: selectedOwner, tradeDirection: direction };
      if (plan) await updateTradePlan(plan.planId, body);
      else await createTradePlan(body);
      // 현재 필터에서 저장한 내역이 숨겨질 경우 전체 자사로 돌아간다.
      setOwnerCompany((current) => current === selectedOwner ? current : "");
      setPlanEditor(null);
      refresh();
      showToast("success", plan ? "예정 내역을 수정했습니다." : "예정 내역을 등록했습니다.");
    } catch (error) {
      setPlanError(error.message || "예정 내역을 저장하지 못했습니다.");
    } finally {
      setSavingPlan(false);
    }
  };

  const removePlan = async () => {
    const plan = planEditor?.plan;
    if (!plan || planBusy) return;
    const confirmed = await confirm({
      title: "예정 내역 삭제",
      message: plan.counterparty ? `${plan.counterparty} 예정 내역을 삭제할까요?` : "이 예정 내역을 삭제할까요?",
      confirmLabel: "삭제",
      cancelLabel: "취소",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingPlan(true);
    setPlanError("");
    try {
      await deleteTradePlan(plan.planId);
      setPlanEditor(null);
      refresh();
      showToast("success", "예정 내역을 삭제했습니다.");
    } catch (error) {
      setPlanError(error.message || "예정 내역을 삭제하지 못했습니다.");
    } finally {
      setDeletingPlan(false);
    }
  };

  return {
    payments,
    plans,
    ownerCompany,
    onOwnerCompanyChange: (value) => {
      setOwnerCompany(value);
      refresh();
    },
    onRefresh: refresh,
    onOpenDetail: setDetailId,
    detailModal: { ...detailModal, onClose: () => setDetailId(null) },
    onOpenPlan: (direction, plan = null) => {
      setPlanError("");
      setPlanEditor({ direction, plan });
    },
    planModal: {
      editor: planEditor,
      ownerCompany,
      saving: savingPlan,
      deleting: deletingPlan,
      busy: planBusy,
      error: planError,
      onSubmit: submitPlan,
      onDelete: removePlan,
      onClose: () => setPlanEditor(null),
    },
    deletePlanConfirm,
    toast,
  };
}
