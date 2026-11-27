import { useEffect, useState } from "react";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import {
  fetchTransactionDetail,
  updateManualItem,
  updateTransactionHeader,
  updateTransactionPayment,
  updateWeighingRecord,
  VERSION_CONFLICT_CODE,
} from "../api/transactionApi";
import {
  displayAmountOf,
  MANUAL_TRADE_DIRECTION_OPTIONS,
  diffPercentOf,
  settlementSummaryOf,
  PAYMENT_STATUS_LABELS,
  TRADE_DIRECTION_LABELS,
  sortWeighingRecords,
  sumWithMissing,
  toInputValue,
  toNumberOrNull,
} from "../constants";
import { useSettlementLines } from "./useSettlementLines";
import { useWeighingMapping } from "./useWeighingMapping";
import { useWeighingSlipDownload } from "../../weighing/hooks/useWeighingSlipDownload";

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
  // 거래 헤더 수정 — 편집 중일 때만 { companyId, counterpartyName, tradeDirection, transactionDate } (null=편집 안 함)
  const [headerDraft, setHeaderDraft] = useState(null);
  const [headerSaving, setHeaderSaving] = useState(false);
  // 버전 충돌 후 다시 불러와도 안내가 남도록 거래 ID 와 함께 보관한다(다른 거래를 열면 보이지 않음)
  const [headerErrorState, setHeaderErrorState] = useState(null);
  const setHeaderError = (message) => setHeaderErrorState(message ? { transactionId, message } : null);
  const headerError = headerErrorState?.transactionId === transactionId ? headerErrorState.message : "";
  const companySearch = useCompanySearch(headerDraft != null);
  // 계근 품목 수동 매핑(거래처는 헤더에서만 변경) — 거래 버전이 오르므로 저장 후 상세를 다시 받고 목록도 갱신한다
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
    setHeaderDraft(null);
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

  // 정산 줄(품목 나누기·반품)은 진행 중인 매출 계근 거래에서만 편집한다
  const settlementEditable = editable && isSale && isWeighing;

  // 포함 항목 — 계근 거래는 계근 행, 수기 거래는 수기 품목
  const rows = !current
    ? []
    : (isWeighing ? sortWeighingRecords(current.weighingRecords ?? []) : current.manualItems ?? []).map((row) => {
        const key = String(row.mappingId ?? row.manualItemId);
        // 정산 줄 — 있으면 서버가 매출 줄 합계를 실제출고량·금액으로 내려준다(적용 단가는 null)
        const settlementLines = row.settlementLines ?? [];
        const split = settlementLines.length > 0;
        // 반품 합계·차이는 서버 값을 우선하고, 없으면 정산 줄로 계산한다
        const computed = split ? settlementSummaryOf(settlementLines, row.netWeightKg) : null;
        const settlementSummary = split
          ? {
              returnedWeightKg: row.returnedWeightKg ?? computed.returnedWeightKg,
              diffKg: row.settlementDiffKg ?? computed.diffKg,
              diffPercent: diffPercentOf(row.settlementDiffKg ?? computed.diffKg, row.netWeightKg),
            }
          : null;
        const actualDeliveryWeightKg = row.actualDeliveryWeightKg;
        const actualDeliveryDefault = toInputValue(actualDeliveryWeightKg ?? row.netWeightKg);
        // 출고 행의 실제출고량이 비어 있으면 실중량 기본값을 저장 대상으로 잡아 둔다
        // (항목 저장 전에는 결제정보를 저장할 수 없으므로 기본값이 서버에 반드시 반영된다)
        // 정산 줄이 있는 행은 적용 단가·실제출고량을 직접 입력하지 않는다
        const autoDraft =
          editable && isSale && !split && row.actualDeliveryWeightKg == null
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
          actualDeliveryWeightKg,
          // 실제출고량 입력란 기본값 — 저장된 값이 없으면 실중량
          actualDeliveryDefault,
          unitPrice: split ? null : row.unitPrice,
          amount: displayAmountOf(row),
          draft: split ? null : rowDrafts[key] ?? autoDraft,
          settlementLines,
          settlementSummary,
        };
      });
  const dirtyRows = rows.filter((row) => row.draft);
  const slip = useWeighingSlipDownload();
  // 총 중량은 인수량 합계 — 인수량이 없는 항목은 합계에서 빠지므로 누락 여부를 함께 표시한다
  const accepted = sumWithMissing(rows.map((row) => row.acceptedWeightKg));
  const actualDelivery = sumWithMissing(rows.map((row) => row.actualDeliveryWeightKg));

  // 정산 줄 편집 — 저장 응답(거래 상세 전체)으로 교체하고 목록 금액도 갱신한다
  const { openSettlement, settlementModal } = useSettlementLines({
    transaction: current,
    onSaved: (result) => {
      setDetail(result);
      setHeaderError("");
      onChanged?.();
    },
    onConflict: () => {
      // 다시 불러와도 안내가 남도록 거래 헤더 안내 자리에 띄운다
      setHeaderError("다른 작업자가 먼저 수정했습니다. 최신 내용을 다시 불러왔으니 정산 줄을 다시 입력하세요.");
      setReloadKey((key) => key + 1);
      onChanged?.();
    },
  });

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

  // 거래구분 변경 — 미결제 거래만 가능하고 UNKNOWN 으로는 바꿀 수 없다(이미 UNKNOWN 이면 그대로 둘 수는 있다)
  const directionEditable = current?.paymentStatus === "UNPAID";
  const directionChanged = headerDraft != null && headerDraft.tradeDirection !== current?.tradeDirection;
  const directionOptions =
    current?.tradeDirection === "UNKNOWN"
      ? [{ value: "UNKNOWN", label: TRADE_DIRECTION_LABELS.UNKNOWN }, ...MANUAL_TRADE_DIRECTION_OPTIONS]
      : MANUAL_TRADE_DIRECTION_OPTIONS;

  // 거래 헤더 수정 — API 는 거래처·거래구분·거래일·비고를 모두 덮어쓰므로 바꾸지 않는 값(비고)도 현재 값을 그대로 보낸다.
  // 계근 거래는 서버에서 소속 계근 매핑의 거래처도 함께 바뀐다.
  const saveHeader = async () => {
    if (!headerDraft?.companyId) {
      setHeaderError("거래처를 선택하세요.");
      return;
    }
    if (!headerDraft.transactionDate) {
      setHeaderError("거래일을 입력하세요.");
      return;
    }
    // 거래구분이 바뀌면 금액 계산식·실제출고량 사용 여부가 달라지므로 입력 중인 항목 값을 먼저 저장하게 한다
    if (directionChanged && Object.keys(rowDrafts).length > 0) {
      setHeaderError("저장하지 않은 항목 변경이 있습니다. 항목을 먼저 저장하세요.");
      return;
    }
    setHeaderSaving(true);
    setHeaderError("");
    try {
      const result = await updateTransactionHeader(current.transactionId, {
        companyId: Number(headerDraft.companyId),
        counterpartyName: headerDraft.counterpartyName || null,
        tradeDirection: headerDraft.tradeDirection,
        transactionDate: headerDraft.transactionDate,
        memo: current.memo ?? null,
        version: current.version,
      });
      setDetail(result);
      setHeaderDraft(null);
      onChanged?.();
    } catch (saveError) {
      if (saveError.code === VERSION_CONFLICT_CODE) {
        setHeaderError("다른 작업자가 먼저 수정했습니다. 최신 내용을 다시 불러옵니다.");
        setReloadKey((key) => key + 1);
      } else {
        // 결제 진행 거래·원본 계근과 다른 거래구분 등은 서버 메시지(409 STATE_CONFLICT)를 그대로 보여준다
        setHeaderError(saveError.message || "거래 정보를 수정하지 못했습니다.");
      }
    } finally {
      setHeaderSaving(false);
    }
  };

  // 결제금액 기본값 —저장된 결제금액이 있으면 그 값, 없으면 결제 완료일 때 API 의 총 금액, 그 외 상태는 0
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
    // 거래 헤더(거래처·입출고 구분·거래일) 수정 — 결제 완료 전 진행 중 거래만
    header: {
      editable,
      editing: headerDraft != null,
      draft: headerDraft,
      companySearch,
      directionOptions,
      directionEditable,
      directionChanged,
      saving: headerSaving,
      error: headerError,
      onStart: () => {
        setHeaderDraft({
          companyId: current?.companyId ?? "",
          counterpartyName: current?.companyId != null ? current.counterpartyName ?? "" : "",
          tradeDirection: current?.tradeDirection ?? "",
          transactionDate: current?.transactionDate ?? "",
        });
        setHeaderError("");
      },
      onChange: (patch) => setHeaderDraft((draft) => ({ ...draft, ...patch })),
      onCancel: () => {
        setHeaderDraft(null);
        setHeaderError("");
      },
      onSave: saveHeader,
    },
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
      // 품목 나누기·반품 — 매핑과 같은 이유로 직접 입력한 값이 있으면 먼저 저장하게 한다
      settlementEditable,
      onSettlement: openSettlement,
      // 계근표 출력 — 결제 완료 뒤에도 출력할 수 있다. 수기 품목에는 계근이 없어 버튼이 없다
      slipDownloadingId: slip.downloadingId,
      slipError: slip.error?.message ?? "",
      onDownloadSlip: (row) =>
        slip.download(
          row.source.weighingRecordId,
          `계근표_${row.source.weighingDate}_${row.vehicleNumber || row.source.weighingRecordId}.pdf`,
        ),
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
    settlementModal,
    onRetry: () => setReloadKey((key) => key + 1),
  };
}
