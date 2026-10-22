import { useState } from "react";
import { createAdjustment, createTransfer } from "../api/inventoryApi";
import { parseQuantity, REASON_MAX_LENGTH } from "../constants";

const createInitialForm = ({ mode, ownerCompany, occurredDate, itemId }) => ({
  mode,
  ownerCompany,
  occurredDate,
  fromItemId: mode === "TRANSFER" ? itemId ?? "" : "",
  toItemId: "",
  itemId: mode === "ADJUSTMENT" ? itemId ?? "" : "",
  direction: "INCREASE",
  quantity: "",
  reason: "",
});

// 품목 간 이동·재고 증감 입력 모달
//  - today: 미래 날짜 입력 방지용
//  - ownStockOf(ownerCompany, occurredDate, itemId): 화면에 떠 있는 재고와 조건이 같을 때만 자체 재고를 돌려준다(음수 경고용)
export function useMovementForm({ today, itemOptions, ownStockOf, showToast, onSaved }) {
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const open = (options) => {
    setForm(createInitialForm(options));
    setError("");
  };

  const close = () => {
    if (submitting) return;
    setForm(null);
  };

  const quantityKg = parseQuantity(form?.quantity);
  const isTransfer = form?.mode === "TRANSFER";
  const sourceItemId = isTransfer ? form?.fromItemId : form?.direction === "DECREASE" ? form?.itemId : "";

  const blocker = (() => {
    if (!form) return "";
    if (!form.ownerCompany) return "자사를 선택하세요.";
    if (!form.occurredDate) return "발생일을 입력하세요.";
    if (form.occurredDate > today) return "미래 날짜는 입력할 수 없습니다.";
    if (isTransfer) {
      if (!form.fromItemId || !form.toItemId) return "출발 품목과 도착 품목을 선택하세요.";
      if (String(form.fromItemId) === String(form.toItemId)) return "출발 품목과 도착 품목이 같습니다.";
    } else if (!form.itemId) {
      return "품목을 선택하세요.";
    }
    if (quantityKg == null || quantityKg <= 0) return "수량은 0보다 커야 합니다.";
    if (form.reason.length > REASON_MAX_LENGTH) return `사유는 ${REASON_MAX_LENGTH}자 이하로 입력하세요.`;
    return "";
  })();

  // 이동·차감 수량이 장부 재고보다 커도 막지 않고 경고만 한다
  const sourceStock = form && sourceItemId ? ownStockOf(form.ownerCompany, form.occurredDate, sourceItemId) : null;
  const shortageWarning =
    sourceStock != null && quantityKg != null && quantityKg > sourceStock
      ? `출발 품목 자체 재고(${sourceStock.toLocaleString("ko-KR")} kg)보다 많아 저장하면 재고가 음수가 됩니다.`
      : "";

  const submit = async () => {
    if (!form || blocker || submitting) return;
    setSubmitting(true);
    setError("");
    const common = {
      ownerCompany: form.ownerCompany,
      occurredDate: form.occurredDate,
      quantityKg,
      reason: form.reason.trim() || null,
    };
    try {
      const response = isTransfer
        ? await createTransfer({ ...common, fromItemId: Number(form.fromItemId), toItemId: Number(form.toItemId) })
        : await createAdjustment({ ...common, itemId: Number(form.itemId), direction: form.direction });
      showToast("success", response?.message ?? "등록되었습니다.");
      setForm(null);
      onSaved();
    } catch (submitError) {
      setError(submitError.message || "등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    open,
    modal: {
      form,
      today,
      itemOptions,
      blocker,
      shortageWarning,
      submitting,
      error,
      onChange: (field, value) =>
        setForm((current) => {
          if (field !== "mode" || value === current.mode) return { ...current, [field]: value };
          // 유형을 바꿔도 고른 품목은 유지한다(이동의 출발 품목 ↔ 증감 품목)
          return value === "TRANSFER"
            ? { ...current, mode: value, fromItemId: current.itemId, itemId: "" }
            : { ...current, mode: value, itemId: current.fromItemId, fromItemId: "", toItemId: "" };
        }),
      onSubmit: submit,
      onClose: close,
    },
  };
}
