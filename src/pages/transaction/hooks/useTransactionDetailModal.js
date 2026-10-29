import { useEffect, useState } from "react";
import {
  fetchTransactionDetail,
  updateManualItem,
  updateTransactionPayment,
  updateWeighingRecord,
  VERSION_CONFLICT_CODE,
} from "../api/transactionApi";
import {
  displayAmountOf,
  PAYMENT_STATUS_LABELS,
  sortWeighingRecords,
  sumWithMissing,
  toInputValue,
  toNumberOrNull,
} from "../constants";
import { useWeighingMapping } from "./useWeighingMapping";

const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }));

// 항목 1건 저장 — 계근 행은 단가·실제출고량만, 수기 품목은 나머지 값을 그대로 두고 전체를 보낸다.
// 입고 거래는 실제출고량을 쓰지 않으므로 기존 값을 유지한다.
const saveRow = (transaction, row, draft, version) => {
  const appliedUnitPrice = toNumberOrNull(draft.unitPrice);
  const actualDeliveryWeightKg =
    transaction.tradeDirection === "SALE" ? toNumberOrNull(draft.actualDeliveryWeightKg) : row.source.actualDeliveryWeightKg;
  if (row.isWeighing) {
    return updateWeighingRecord(transaction.transactionId, row.source.mappingId, { appliedUnitPrice, actualDeliveryWeightKg, version });
  }
  const item = row.source;
  return updateManualItem(transaction.transactionId, item.manualItemId, {
    vehicleNumber: item.vehicleNumber,
    itemId: item.itemId,
    itemName: item.itemName,
    netWeightKg: item.netWeightKg,
    acceptedWeightKg: item.acceptedWeightKg,
    deductionWeightKg: item.deductionWeightKg,
    appliedUnitPrice,
    actualDeliveryWeightKg,
    memo: item.memo,
    version,
  });
};

// 거래 상세 모달 — 상세 조회, 항목 단가·실제출고량 수정, 결제정보 저장. 저장되면 onChanged 로 목록 갱신을 알린다.
export function useTransactionDetailModal(transactionId, onChanged) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [rowDrafts, setRowDrafts] = useState({}); // 행 key → { unitPrice, actualDeliveryWeightKg } (입력 문자열)
  const [rowsSaving, setRowsSaving] = useState(false);
  const [rowsError, setRowsError] = useState("");
  // 계근 수동 매핑 — 거래 버전이 오르므로 저장 후 상세를 다시 받고 목록도 갱신한다
  const { openMapping, mappingModal } = useWeighingMapping(() => {
    setReloadKey((key) => key + 1);
    onChanged?.();
  });

  useEffect(() => {
    if (transactionId == null) return undefined;
    let alive = true;
    setLoading(true);
    setError("");
    setPaymentDraft(null);
    setPaymentError("");
    setRowDrafts({});
    setRowsError("");
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
  // 결제 완료(마감) 전 진행 중 거래만 항목·결제정보를 수정할 수 있다
  const editable = Boolean(current) && current.paymentStatus !== "PAID" && current.transactionStatus === "OPEN";

  // 포함 항목 — 계근 거래는 계근 행, 수기 거래는 수기 품목
  const rows = !current
    ? []
    : (isWeighing ? sortWeighingRecords(current.weighingRecords ?? []) : current.manualItems ?? []).map((row) => {
        const key = String(row.mappingId ?? row.manualItemId);
        const actualDeliveryDefault = toInputValue(row.actualDeliveryWeightKg ?? row.netWeightKg);
        // 출고 행의 실제출고량이 비어 있으면 실중량 기본값을 저장 대상으로 잡아 둔다
        // (항목 저장 전에는 결제정보를 저장할 수 없으므로 기본값이 서버에 반드시 반영된다)
        const autoDraft =
          editable && isSale && row.actualDeliveryWeightKg == null
            ? { unitPrice: toInputValue(row.unitPrice), actualDeliveryWeightKg: actualDeliveryDefault }
            : null;
        return {
          key,
          isWeighing,
          source: row,
          vehicleNumber: row.vehicleNumber,
          itemName: row.itemName,
          // 1차·2차 중량은 계근 행에만 있다(수기 품목은 없음)
          firstWeightKg: row.firstWeightKg,
          secondWeightKg: row.secondWeightKg,
          mapped: row.itemId != null,
          netWeightKg: row.netWeightKg,
          acceptedWeightKg: row.acceptedWeightKg,
          actualDeliveryWeightKg: row.actualDeliveryWeightKg,
          // 실제출고량 입력란 기본값 — 저장된 값이 없으면 실중량
          actualDeliveryDefault,
          unitPrice: row.unitPrice,
          amount: displayAmountOf(row),
          draft: rowDrafts[key] ?? autoDraft,
        };
      });
  const dirtyRows = rows.filter((row) => row.draft);
  // 총 중량은 인수량 합계 — 인수량이 없는 항목은 합계에서 빠지므로 누락 여부를 함께 표시한다
  const accepted = sumWithMissing(rows.map((row) => row.acceptedWeightKg));
  const actualDelivery = sumWithMissing(rows.map((row) => row.actualDeliveryWeightKg));

  const changeRowDraft = (row, patch) =>
    setRowDrafts((drafts) => {
      const base = drafts[row.key] ?? row.draft ?? {
        unitPrice: toInputValue(row.unitPrice),
        actualDeliveryWeightKg: row.actualDeliveryDefault,
      };
      return { ...drafts, [row.key]: { ...base, ...patch } };
    });

  // 변경한 행을 순서대로 저장 — 저장할 때마다 거래 version 이 올라가므로 직전 응답의 version 을 이어 쓴다
  const saveRows = async () => {
    const invalid = dirtyRows.some(
      (row) => (toNumberOrNull(row.draft.unitPrice) ?? 0) < 0 || (toNumberOrNull(row.draft.actualDeliveryWeightKg) ?? 0) < 0
    );
    if (invalid) {
      setRowsError("단가와 실제출고량은 0 이상이어야 합니다.");
      return;
    }
    setRowsSaving(true);
    setRowsError("");
    let latest = current;
    try {
      for (const row of dirtyRows) {
        latest = await saveRow(current, row, row.draft, latest.version);
      }
      setDetail(latest);
      setRowDrafts({});
      onChanged?.();
    } catch (saveError) {
      setRowsError(
        saveError.code === VERSION_CONFLICT_CODE
          ? "다른 작업자가 먼저 수정했습니다. 최신 내용을 다시 불러옵니다."
          : saveError.message || "항목을 저장하지 못했습니다."
      );
      // 일부만 저장됐을 수 있으므로 최신 상태를 다시 받는다
      setReloadKey((key) => key + 1);
      onChanged?.();
    } finally {
      setRowsSaving(false);
    }
  };

  // 결제금액 기본값 — 저장된 결제금액이 있으면 그 값, 없으면 결제 완료일 때 API 의 총 금액, 그 외 상태는 0
  const defaultPaymentAmountOf = (paymentStatus) =>
    toInputValue(paymentStatus === "PAID" ? current?.displayAmount : 0);
  const initialPaymentStatus = current?.paymentStatus ?? "UNPAID";
  const payment = paymentDraft ?? {
    paymentStatus: initialPaymentStatus,
    paymentAmount: current?.paymentAmount != null ? toInputValue(current.paymentAmount) : defaultPaymentAmountOf(initialPaymentStatus),
  };

  const savePayment = async () => {
    const paymentAmount = toNumberOrNull(payment.paymentAmount);
    if (paymentAmount != null && paymentAmount < 0) {
      setPaymentError("결제금액은 0 이상이어야 합니다.");
      return;
    }
    if (dirtyRows.length > 0) {
      setPaymentError("저장하지 않은 항목 변경이 있습니다. 항목을 먼저 저장하세요.");
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
    acceptedWeightKg: accepted.total,
    acceptedMissing: accepted.missing,
    actualDeliveryWeightKg: actualDelivery.total,
    actualDeliveryMissing: actualDelivery.missing,
    items: {
      rows,
      isSale,
      isWeighing,
      currency: current?.currency,
      editable,
      dirtyCount: dirtyRows.length,
      // 되돌리기는 직접 입력한 값만 지운다(실제출고량 자동 기본값은 남는다)
      resettable: Object.keys(rowDrafts).length > 0,
      saving: rowsSaving,
      error: rowsError,
      onDraftChange: changeRowDraft,
      onReset: () => {
        setRowDrafts({});
        setRowsError("");
      },
      onSave: saveRows,
      // 진행 중인 계근 거래만 매핑 가능. 매핑 후 상세를 다시 받으므로 직접 입력한 값이 있으면 먼저 저장하게 한다
      mappable: isWeighing && editable,
      mappingBlocked: Object.keys(rowDrafts).length > 0,
      onMap: (row) =>
        openMapping({
          weighingRecordId: row.source.weighingRecordId,
          sourceCounterpartyName: row.source.counterpartyName,
          sourceItemName: row.source.itemName,
          itemId: row.source.itemId,
          itemName: row.source.itemName,
        }),
    },
    payment: {
      ...payment,
      editable,
      saving,
      error: paymentError,
      statusOptions: PAYMENT_STATUS_OPTIONS,
      // 결제상태를 바꾸면 결제금액을 그 상태의 기본값으로 다시 채운다(이후 직접 수정 가능)
      onChange: (patch) =>
        setPaymentDraft({
          ...payment,
          ...patch,
          ...(patch.paymentStatus ? { paymentAmount: defaultPaymentAmountOf(patch.paymentStatus) } : {}),
        }),
      onSave: savePayment,
    },
    mappingModal,
    onRetry: () => setReloadKey((key) => key + 1),
  };
}
