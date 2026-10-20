import { useEffect, useState } from "react";
import { fetchTransactionDetail, updateTransactionPayment, VERSION_CONFLICT_CODE } from "../api/transactionApi";
import {
  displayAmountOf,
  PAYMENT_STATUS_LABELS,
  sortWeighingRecords,
  sumWithMissing,
  toInputValue,
  toNumberOrNull,
} from "../constants";

const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

// 거래 상세 모달 — 상세 조회와 결제정보 저장. 저장되면 onChanged 로 목록 갱신을 알린다.
export function useTransactionDetailModal(transactionId, onChanged) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (transactionId == null) return undefined;
    let alive = true;
    setLoading(true);
    setError("");
    setPaymentDraft(null);
    setPaymentError("");
    fetchTransactionDetail(transactionId)
      .then((response) => {
        if (alive) setDetail(response);
      })
      .catch((loadError) => {
        if (!alive) return;
        setDetail(null);
        setError(loadError.message || "거래를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [transactionId, reloadKey]);

  // 다른 거래를 열었는데 이전 거래 응답이 남아 있으면 보여주지 않는다
  const current = detail?.transactionId === transactionId ? detail : null;
  const isSale = current?.tradeDirection === "SALE";
  const isWeighing = current?.transactionOrigin === "WEIGHING";

  // 포함 항목 — 계근 거래는 계근 행, 수기 거래는 수기 품목
  const rows = !current
    ? []
    : (isWeighing ? sortWeighingRecords(current.weighingRecords ?? []) : current.manualItems ?? []).map((row) => ({
        key: row.mappingId ?? row.manualItemId,
        vehicleNumber: row.vehicleNumber,
        itemName: row.itemName,
        mapped: row.itemId != null,
        netWeightKg: row.netWeightKg,
        acceptedWeightKg: row.acceptedWeightKg,
        actualDeliveryWeightKg: row.actualDeliveryWeightKg,
        unitPrice: row.unitPrice,
        amount: displayAmountOf(row),
      }));
  // 총 중량은 인수량 합계 — 인수량이 없는 항목은 합계에서 빠지므로 누락 여부를 함께 표시한다
  const accepted = sumWithMissing(rows.map((row) => row.acceptedWeightKg));
  const actualDelivery = sumWithMissing(rows.map((row) => row.actualDeliveryWeightKg));

  // 결제 완료(마감) 전에만 결제정보를 수정할 수 있다
  const paymentEditable = Boolean(current) && current.paymentStatus !== "PAID" && current.transactionStatus !== "MERGED";
  // 결제금액 기본값은 저장된 결제금액, 없으면 API 의 총 금액
  const payment = paymentDraft ?? {
    paymentStatus: current?.paymentStatus ?? "UNPAID",
    paymentAmount: toInputValue(current?.paymentAmount ?? current?.displayAmount),
  };

  const savePayment = async () => {
    const paymentAmount = toNumberOrNull(payment.paymentAmount);
    if (paymentAmount != null && paymentAmount < 0) {
      setPaymentError("결제금액은 0 이상이어야 합니다.");
      return;
    }
    if (payment.paymentStatus === "PAID" && isSale && current.hasMissingUnitPrice) {
      setPaymentError("적용 단가가 없는 출고 항목이 있어 결제 완료로 저장할 수 없습니다.");
      return;
    }
    setSaving(true);
    setPaymentError("");
    try {
      const result = await updateTransactionPayment(current.transactionId, {
        paymentStatus: payment.paymentStatus,
        paymentAmount,
        version: current.version,
      });
      setDetail(result);
      setPaymentDraft(null);
      onChanged?.();
    } catch (saveError) {
      if (saveError.code === VERSION_CONFLICT_CODE) {
        setPaymentError("다른 작업자가 먼저 수정했습니다. 최신 내용을 다시 불러옵니다.");
        setReloadKey((key) => key + 1);
      } else {
        setPaymentError(saveError.message || "결제정보를 저장하지 못했습니다.");
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    open: transactionId != null,
    loading: loading || (transactionId != null && !current && !error),
    error,
    detail: current,
    isSale,
    rows,
    acceptedWeightKg: accepted.total,
    acceptedMissing: accepted.missing,
    actualDeliveryWeightKg: actualDelivery.total,
    actualDeliveryMissing: actualDelivery.missing,
    payment: {
      ...payment,
      editable: paymentEditable,
      saving,
      error: paymentError,
      statusOptions: PAYMENT_STATUS_OPTIONS,
      onChange: (patch) => setPaymentDraft({ ...payment, ...patch }),
      onSave: savePayment,
    },
    onRetry: () => setReloadKey((key) => key + 1),
  };
}
