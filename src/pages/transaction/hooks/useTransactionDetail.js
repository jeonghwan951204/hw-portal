import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import { useToast } from "../../contract/hooks/useToast";
import {
  addManualItem,
  cancelTransactionConfirmation,
  confirmTransaction,
  deleteManualItem,
  fetchTransactionDetail,
  fetchTransactionHistory,
  moveWeighingRecords,
  splitTransaction,
  updateManualItem,
  updateTransactionHeader,
  updateTransactionPayment,
  updateWeighingRecord,
  VERSION_CONFLICT_CODE,
} from "../api/transactionApi";
import {
  createEmptyManualItem,
  displayAmountOf,
  groupConsecutiveByVehicle,
  manualItemToForm,
  manualItemToRequest,
  PAYMENT_STATUS_LABELS,
  previewAmounts,
  sortWeighingRecords,
  sumWithMissing,
  toInputValue,
  toNumberOrNull,
  TRADE_DIRECTION_LABELS,
  validateManualItem,
} from "../constants";
import { useItemOptions } from "./useItemOptions";

const CLOSED_MODALS = { confirm: false, cancel: false, split: false, move: false, deleteItemId: null };
const INITIAL_MOVE = { targetIdInput: "", target: null, loadingTarget: false, targetError: "", allowMismatch: false };

const normalizeName = (value) => (value ?? "").trim().toLocaleLowerCase("ko-KR");

// 거래 상세의 경고 목록 — 미매핑·미입력·구분 해석 실패·묶음 경고·원본 변경·실제출고량 일부 미입력
const buildWarnings = (detail, rows) => {
  if (!detail) return [];
  const warnings = [];
  const isWeighing = detail.transactionOrigin === "WEIGHING";
  if (!detail.counterpartyName) warnings.push({ tone: "amber", text: "거래처명이 입력되지 않았습니다." });
  else if (detail.companyId == null) warnings.push({ tone: "amber", text: `거래처 '${detail.counterpartyName}'이(가) 내부 거래처와 매핑되지 않았습니다.` });
  if (detail.tradeDirection === "UNKNOWN") warnings.push({ tone: "red", text: "거래구분(입고·출고)을 해석하지 못했습니다. 거래정보에서 구분을 지정해야 확인할 수 있습니다." });

  const noItemName = rows.filter((row) => !row.itemName).length;
  const unmappedItems = rows.filter((row) => row.itemName && row.itemId == null).length;
  if (noItemName) warnings.push({ tone: "amber", text: `품목명이 입력되지 않은 ${isWeighing ? "계근" : "품목"} ${noItemName}건이 있습니다.` });
  if (unmappedItems) warnings.push({ tone: "amber", text: `내부 품목과 매핑되지 않은 ${isWeighing ? "계근" : "품목"} ${unmappedItems}건이 있습니다.` });

  if (isWeighing) {
    const groupingNotes = detail.weighingRecords.filter((record) => record.groupingNote);
    if (groupingNotes.length) warnings.push({ tone: "red", text: `자동 묶음 경고 ${groupingNotes.length}건 — 함께 묶인 계근이 맞는지 확인하세요.` });
    const deleted = detail.weighingRecords.filter((record) => record.sourceDeleted).length;
    if (deleted) warnings.push({ tone: "red", text: `원본 계근이 삭제·변경된 행 ${deleted}건이 있습니다.` });
    const differentNames = new Set(detail.weighingRecords.map((record) => normalizeName(record.counterpartyName)).filter(Boolean));
    if (differentNames.size > 1) warnings.push({ tone: "amber", text: "서로 다른 원본 거래처명이 한 거래에 포함되어 있습니다." });
  }
  if (detail.hasMissingUnitPrice) {
    warnings.push({
      tone: detail.tradeDirection === "SALE" ? "red" : "amber",
      text: detail.tradeDirection === "SALE" ? "적용 단가가 없는 출고 행이 있어 거래를 확인할 수 없습니다." : "적용 단가가 없는 행이 있어 금액이 계산되지 않았습니다.",
    });
  }
  if (detail.tradeDirection === "SALE" && detail.amountStatus === "PARTIALLY_CONFIRMED") {
    warnings.push({ tone: "amber", text: "일부 품목의 실제출고량이 입력되지 않았습니다." });
  }
  return warnings;
};

export function useTransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const items = useItemOptions();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const [history, setHistory] = useState({ open: false, loading: false, error: "", list: [] });
  const [headerForm, setHeaderForm] = useState(null); // 거래정보 수정 중일 때만 값이 있다
  const [recordDrafts, setRecordDrafts] = useState({}); // mappingId → { appliedUnitPrice, actualDeliveryWeightKg }
  const [selectedRecordIds, setSelectedRecordIds] = useState([]); // weighingRecordId
  const [manualEdit, setManualEdit] = useState(null); // { itemId: number | "new", value }
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [modals, setModals] = useState(CLOSED_MODALS);
  const [reason, setReason] = useState("");
  const [move, setMove] = useState(INITIAL_MOVE);

  const companySearch = useCompanySearch(Boolean(headerForm));

  // 서버 응답으로 교체할 때 입력 중이던 값은 모두 버린다
  const resetDrafts = () => {
    setHeaderForm(null);
    setRecordDrafts({});
    setSelectedRecordIds([]);
    setManualEdit(null);
    setPaymentDraft(null);
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError("");
    fetchTransactionDetail(id)
      .then((response) => {
        if (!alive) return;
        setDetail(response);
        setHeaderForm(null);
        setRecordDrafts({});
        setSelectedRecordIds([]);
        setManualEdit(null);
        setPaymentDraft(null);
      })
      .catch((error) => {
        if (!alive) return;
        setDetail(null);
        setLoadError(error.status === 404 ? "" : error.message || "거래를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id, reloadKey]);

  const loadHistory = () => {
    setHistory((current) => ({ ...current, open: true, loading: true, error: "" }));
    fetchTransactionHistory(id)
      .then((list) => setHistory({ open: true, loading: false, error: "", list: list ?? [] }))
      .catch((error) => setHistory({ open: true, loading: false, error: error.message || "이력을 불러오지 못했습니다.", list: [] }));
  };

  const reload = () => setReloadKey((current) => current + 1);

  // 변경 요청 공통 처리 — 성공 시 응답으로 상세 교체, 버전 충돌 시 최신 데이터 재조회
  const mutate = async (request, successMessage, { onSuccess } = {}) => {
    setBusy(true);
    try {
      const result = await request();
      if (result?.transactionId === detail.transactionId) {
        setDetail(result);
        resetDrafts();
      } else {
        reload();
      }
      if (history.open) loadHistory();
      onSuccess?.(result);
      if (successMessage) showToast("success", typeof successMessage === "function" ? successMessage(result) : successMessage);
      return true;
    } catch (error) {
      if (error.code === VERSION_CONFLICT_CODE) {
        showToast("error", "다른 작업자가 먼저 수정했습니다. 최신 내용을 다시 불러옵니다.");
        reload();
      } else {
        showToast("error", error.message || "요청을 처리하지 못했습니다.");
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  // ─── 파생 값 ────────────────────────────────────────────────────────────
  const confirmed = Boolean(detail?.confirmedAt);
  const merged = detail?.transactionStatus === "MERGED";
  const editable = Boolean(detail) && !confirmed && detail.transactionStatus === "OPEN";
  const isWeighing = detail?.transactionOrigin === "WEIGHING";
  const direction = detail?.tradeDirection;
  const version = detail?.version;

  // 계근 행 — 입력 중인 값이 있으면 미리보기 금액으로 보여준다
  const weighingRows = sortWeighingRecords(detail?.weighingRecords ?? []).map((record) => {
    const draft = recordDrafts[record.mappingId];
    if (!draft) return { ...record, dirty: false, draft: null };
    const unitPrice = toNumberOrNull(draft.appliedUnitPrice);
    const actualDeliveryWeightKg = direction === "SALE" ? toNumberOrNull(draft.actualDeliveryWeightKg) : record.actualDeliveryWeightKg;
    return {
      ...record,
      ...previewAmounts(direction, { ...record, unitPrice, actualDeliveryWeightKg }),
      unitPrice,
      actualDeliveryWeightKg,
      dirty: true,
      draft,
    };
  });
  const manualRows = detail?.manualItems ?? [];
  const rows = isWeighing ? weighingRows : manualRows;
  const accepted = sumWithMissing(rows.map((row) => row.acceptedWeightKg));
  const deduction = sumWithMissing(rows.map((row) => row.deductionWeightKg));
  const vehicles = [...new Set(rows.map((row) => row.vehicleNumber).filter(Boolean))];
  const itemNames = [...new Set(rows.map((row) => row.itemName).filter(Boolean))];
  const warnings = buildWarnings(detail, rows);
  const dirtyCount = Object.keys(recordDrafts).length;

  const summary = detail && {
    counterpartyName: detail.counterpartyName,
    tradeDirectionLabel: TRADE_DIRECTION_LABELS[direction] ?? direction,
    vehicles,
    itemCount: itemNames.length,
    rowCount: rows.length,
    totalWeightKg: detail.totalWeightKg,
    acceptedWeightKg: accepted.total,
    acceptedMissing: accepted.missing,
    deductionWeightKg: deduction.total,
    deductionMissing: deduction.missing,
    estimatedAmount: detail.estimatedAmount,
    actualAmount: detail.actualAmount,
    displayAmount: detail.displayAmount,
    amountStatus: detail.amountStatus,
    currency: detail.currency,
  };

  // 거래 확인 차단 사유 — 미매핑은 막지 않는다
  const confirmBlockers = [];
  if (detail) {
    if (direction === "UNKNOWN") confirmBlockers.push("거래구분을 입고 또는 출고로 지정해야 합니다.");
    if (direction === "SALE" && detail.hasMissingUnitPrice) confirmBlockers.push("출고 거래의 모든 행에 적용 단가를 입력해야 합니다.");
    if (direction === "PURCHASE" && rows.some((row) => row.acceptedWeightKg == null)) confirmBlockers.push("입고 거래의 모든 행에 인수량이 필요합니다.");
    if (rows.length === 0) confirmBlockers.push("품목이 한 건 이상 있어야 합니다.");
    if (dirtyCount > 0) confirmBlockers.push("저장하지 않은 단가·실제출고량 입력이 있습니다. 먼저 저장하세요.");
  }

  const closeModals = () => {
    setModals(CLOSED_MODALS);
    setReason("");
    setMove(INITIAL_MOVE);
  };

  // ─── 계근 행 입력 ───────────────────────────────────────────────────────
  const recordById = Object.fromEntries((detail?.weighingRecords ?? []).map((record) => [record.mappingId, record]));
  const changeRecordDraft = (mappingId, patch) =>
    setRecordDrafts((current) => {
      const record = recordById[mappingId];
      const base = current[mappingId] ?? {
        appliedUnitPrice: toInputValue(record.unitPrice),
        actualDeliveryWeightKg: toInputValue(record.actualDeliveryWeightKg),
      };
      return { ...current, [mappingId]: { ...base, ...patch } };
    });

  const saveRecord = (mappingId) => {
    const draft = recordDrafts[mappingId];
    const record = recordById[mappingId];
    if (!draft || !record) return;
    const appliedUnitPrice = toNumberOrNull(draft.appliedUnitPrice);
    const actualDeliveryWeightKg = direction === "SALE" ? toNumberOrNull(draft.actualDeliveryWeightKg) : record.actualDeliveryWeightKg;
    if ((appliedUnitPrice ?? 0) < 0 || (actualDeliveryWeightKg ?? 0) < 0) {
      showToast("error", "적용 단가와 실제출고량은 0 이상이어야 합니다.");
      return;
    }
    mutate(() => updateWeighingRecord(detail.transactionId, mappingId, { appliedUnitPrice, actualDeliveryWeightKg, version }), "저장했습니다.");
  };

  const toggleRecords = (recordIds) =>
    setSelectedRecordIds((current) => {
      const allSelected = recordIds.every((recordId) => current.includes(recordId));
      return allSelected ? current.filter((recordId) => !recordIds.includes(recordId)) : [...new Set([...current, ...recordIds])];
    });

  const selectionBlocker =
    selectedRecordIds.length === 0
      ? "계근을 선택하세요."
      : selectedRecordIds.length >= (detail?.weighingRecords.length ?? 0)
        ? "거래의 모든 계근은 이동·분리할 수 없습니다. 거래 합치기를 사용하세요."
        : "";

  // ─── 이동 대상 거래 조회 ────────────────────────────────────────────────
  const lookupMoveTarget = async () => {
    const targetId = Number(move.targetIdInput);
    if (!Number.isInteger(targetId) || targetId <= 0) {
      setMove((current) => ({ ...current, target: null, targetError: "거래 ID를 숫자로 입력하세요." }));
      return;
    }
    if (targetId === detail.transactionId) {
      setMove((current) => ({ ...current, target: null, targetError: "현재 거래로는 이동할 수 없습니다." }));
      return;
    }
    setMove((current) => ({ ...current, loadingTarget: true, targetError: "", target: null, allowMismatch: false }));
    try {
      const target = await fetchTransactionDetail(targetId);
      let targetError = "";
      if (target.confirmedAt || target.transactionStatus !== "OPEN") targetError = "확인 대기 중인 진행 중 거래로만 이동할 수 있습니다.";
      else if (target.transactionOrigin !== "WEIGHING") targetError = "수기 거래로는 계근을 이동할 수 없습니다.";
      else if (target.ownerCompany !== detail.ownerCompany || target.tradeDirection !== detail.tradeDirection || target.currency !== detail.currency) {
        targetError = "자사, 거래구분, 통화가 같은 거래로만 이동할 수 있습니다.";
      }
      setMove((current) => ({ ...current, loadingTarget: false, target, targetError }));
    } catch (error) {
      setMove((current) => ({ ...current, loadingTarget: false, target: null, targetError: error.message || "거래를 찾을 수 없습니다." }));
    }
  };

  const moveCounterpartyMismatch = Boolean(move.target) &&
    (detail.companyId != null && move.target.companyId != null
      ? detail.companyId !== move.target.companyId
      : normalizeName(detail.counterpartyName) !== normalizeName(move.target.counterpartyName));

  // ─── 수기 품목 ──────────────────────────────────────────────────────────
  const saveManualItem = () => {
    const message = validateManualItem(manualEdit.value);
    if (message) {
      showToast("error", message);
      return;
    }
    const item = manualItemToRequest(manualEdit.value, direction);
    if (manualEdit.itemId === "new") {
      mutate(() => addManualItem(detail.transactionId, { item, version }), "품목을 추가했습니다.");
    } else {
      mutate(() => updateManualItem(detail.transactionId, manualEdit.itemId, { ...item, version }), "품목을 수정했습니다.");
    }
  };

  // ─── 결제 ───────────────────────────────────────────────────────────────
  const payment = paymentDraft ?? {
    paymentStatus: detail?.paymentStatus ?? "UNPAID",
    paymentAmount: toInputValue(detail?.paymentAmount),
  };
  const paymentDirty = Boolean(paymentDraft) &&
    (paymentDraft.paymentStatus !== detail.paymentStatus || toNumberOrNull(paymentDraft.paymentAmount) !== (detail.paymentAmount ?? null));

  return {
    loading,
    loadError,
    detail,
    onBack: () => navigate("/transactions"),
    onReload: reload,
    header: detail && {
      detail,
      confirmed,
      merged,
      editable,
      busy,
      canConfirm: editable,
      canCancelConfirm: confirmed && !merged && detail.paymentStatus !== "PAID",
      form: headerForm,
      companySearch,
      onStartEdit: () =>
        setHeaderForm({
          transactionDate: detail.transactionDate,
          tradeDirection: detail.tradeDirection,
          companyId: detail.companyId,
          counterpartyName: detail.counterpartyName ?? "",
          memo: detail.memo ?? "",
        }),
      onCancelEdit: () => setHeaderForm(null),
      onFormChange: (patch) => setHeaderForm((current) => ({ ...current, ...patch })),
      onSaveEdit: () => {
        if (!headerForm.transactionDate) {
          showToast("error", "거래일을 입력하세요.");
          return;
        }
        mutate(
          () =>
            updateTransactionHeader(detail.transactionId, {
              companyId: headerForm.companyId,
              counterpartyName: headerForm.counterpartyName.trim() || null,
              tradeDirection: headerForm.tradeDirection,
              transactionDate: headerForm.transactionDate,
              memo: headerForm.memo.trim() || null,
              version,
            }),
          "거래정보를 수정했습니다."
        );
      },
      onOpenConfirm: () => setModals({ ...CLOSED_MODALS, confirm: true }),
      onOpenCancel: () => setModals({ ...CLOSED_MODALS, cancel: true }),
      onOpenMerged: () => navigate(`/transactions/${detail.mergedIntoTransactionId}`),
    },
    summary,
    warnings,
    payment: detail && {
      ...payment,
      currency: detail.currency,
      confirmed,
      disabled: merged || busy,
      dirty: paymentDirty,
      statusOptions: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label,
        disabled: value === "PAID" && !confirmed,
      })),
      onChange: (patch) => setPaymentDraft({ ...payment, ...patch }),
      onReset: () => setPaymentDraft(null),
      onSave: () => {
        const paymentAmount = toNumberOrNull(payment.paymentAmount);
        if (paymentAmount != null && paymentAmount < 0) {
          showToast("error", "결제금액은 0 이상이어야 합니다.");
          return;
        }
        if (payment.paymentStatus === "PAID" && !confirmed) {
          showToast("error", "확인 완료된 거래만 결제 완료로 변경할 수 있습니다.");
          return;
        }
        mutate(
          () => updateTransactionPayment(detail.transactionId, { paymentStatus: payment.paymentStatus, paymentAmount, version }),
          "결제정보를 저장했습니다."
        );
      },
    },
    records: isWeighing && {
      groups: groupConsecutiveByVehicle(weighingRows),
      direction,
      currency: detail.currency,
      editable,
      busy,
      selectedIds: selectedRecordIds,
      selectionBlocker,
      dirtyCount,
      onDraftChange: changeRecordDraft,
      onDraftReset: (mappingId) =>
        setRecordDrafts((current) => {
          const next = { ...current };
          delete next[mappingId];
          return next;
        }),
      onSave: saveRecord,
      onToggleRecords: toggleRecords,
      onClearSelection: () => setSelectedRecordIds([]),
      onOpenSplit: () => setModals({ ...CLOSED_MODALS, split: true }),
      onOpenMove: () => setModals({ ...CLOSED_MODALS, move: true }),
    },
    manualItems: detail && !isWeighing && {
      rows: manualRows.map((item) => ({ ...item, displayAmount: displayAmountOf(item) })),
      direction,
      currency: detail.currency,
      editable,
      busy,
      items,
      editing: manualEdit,
      onStartAdd: () => setManualEdit({ itemId: "new", value: createEmptyManualItem() }),
      onStartEdit: (item) => setManualEdit({ itemId: item.manualItemId, value: manualItemToForm(item) }),
      onEditChange: (patch) => setManualEdit((current) => ({ ...current, value: { ...current.value, ...patch } })),
      onCancelEdit: () => setManualEdit(null),
      onSave: saveManualItem,
      onDelete: (manualItemId) => setModals({ ...CLOSED_MODALS, deleteItemId: manualItemId }),
    },
    history: {
      ...history,
      onToggle: () => (history.open ? setHistory((current) => ({ ...current, open: false })) : loadHistory()),
      onOpenTransaction: (transactionId) => navigate(`/transactions/${transactionId}`),
    },
    confirmModal: {
      open: modals.confirm,
      summary,
      warnings,
      blockers: confirmBlockers,
      busy,
      onConfirm: () =>
        mutate(() => confirmTransaction(detail.transactionId, { version, reason: null }), "거래를 확인했습니다.", { onSuccess: closeModals }),
      onClose: closeModals,
    },
    cancelModal: {
      open: modals.cancel,
      reason,
      busy,
      onReasonChange: setReason,
      onConfirm: () =>
        mutate(
          () => cancelTransactionConfirmation(detail.transactionId, { version, reason: reason.trim() || null }),
          "거래 확인을 취소했습니다.",
          { onSuccess: closeModals }
        ),
      onClose: closeModals,
    },
    splitModal: {
      open: modals.split,
      count: selectedRecordIds.length,
      reason,
      busy,
      onReasonChange: setReason,
      onConfirm: () =>
        mutate(
          () => splitTransaction(detail.transactionId, { weighingRecordIds: selectedRecordIds, sourceVersion: version, reason: reason.trim() || null }),
          (result) => `선택한 계근으로 새 거래 #${result.transactionId}을(를) 만들었습니다.`,
          { onSuccess: closeModals }
        ),
      onClose: closeModals,
    },
    moveModal: {
      open: modals.move,
      count: selectedRecordIds.length,
      ...move,
      counterpartyMismatch: moveCounterpartyMismatch,
      reason,
      busy,
      onTargetIdChange: (targetIdInput) => setMove((current) => ({ ...current, targetIdInput, target: null, targetError: "" })),
      onLookup: lookupMoveTarget,
      onAllowMismatchChange: (allowMismatch) => setMove((current) => ({ ...current, allowMismatch })),
      onReasonChange: setReason,
      onConfirm: () =>
        mutate(
          () =>
            moveWeighingRecords(detail.transactionId, {
              targetTransactionId: move.target.transactionId,
              weighingRecordIds: selectedRecordIds,
              sourceVersion: version,
              targetVersion: move.target.version,
              allowCounterpartyMismatch: moveCounterpartyMismatch && move.allowMismatch,
              reason: reason.trim() || null,
            }),
          `선택한 계근을 거래 #${move.target?.transactionId}(으)로 이동했습니다.`,
          { onSuccess: closeModals }
        ),
      onClose: closeModals,
    },
    deleteItemModal: {
      open: modals.deleteItemId != null,
      onConfirm: () =>
        mutate(() => deleteManualItem(detail.transactionId, modals.deleteItemId, { version }), "품목을 삭제했습니다.", { onSuccess: closeModals }),
      onCancel: closeModals,
    },
    toast,
  };
}
