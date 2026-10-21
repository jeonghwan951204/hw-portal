import { useEffect, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import { useToast } from "../../contract/hooks/useToast";
import {
  createTransaction,
  fetchUnassignedWeighingRecords,
  STATE_CONFLICT_CODE,
  VERSION_CONFLICT_CODE,
} from "../api/transactionApi";
import {
  getLocalDateString,
  OWNER_COMPANY_OPTIONS,
  RECORD_TRADE_DIRECTION_OPTIONS,
  sumWithMissing,
  UNASSIGNED_PAGE_SIZE,
} from "../constants";
import { useTransactionDetailModal } from "./useTransactionDetailModal";
import { useWeighingMapping } from "./useWeighingMapping";

const SEARCH_DEBOUNCE_MS = 300;
const MAX_SELECTION = 1000;

const createInitialFilters = (today) => ({
  startDate: today,
  endDate: today,
  ownerCompany: "",
  tradeDirection: "",
  companyId: "",
  companyName: "",
  vehicleNumber: "",
});

const normalizeName = (value) => (value ?? "").trim().toLocaleLowerCase("ko-KR");

// 등록 응답(거래 상세) → 연속 등록 결과 요약
const toRegisteredSummary = (detail) => {
  const records = detail.weighingRecords ?? [];
  return {
    transactionId: detail.transactionId,
    ownerCompany: detail.ownerCompany,
    tradeDirection: detail.tradeDirection,
    counterpartyName: detail.counterpartyName,
    companyId: detail.companyId,
    recordCount: records.length,
    vehicleCount: new Set(records.map((record) => record.vehicleNumber).filter(Boolean)).size,
    acceptedWeightKg: sumWithMissing(records.map((record) => record.acceptedWeightKg)).total,
  };
};

// 선택 계근 묶음 검증 — 서버와 같은 조건(자사·거래구분·통화 동일)
const getSelectionBlocker = (records) => {
  if (records.length === 0) return "등록할 계근을 선택하세요.";
  if (records.length > MAX_SELECTION) return `한 번에 ${MAX_SELECTION}건까지 등록할 수 있습니다.`;
  const [first] = records;
  const mixed = records.some(
    (record) =>
      record.ownerCompany !== first.ownerCompany ||
      (record.tradeDirection ?? null) !== (first.tradeDirection ?? null) ||
      record.currency !== first.currency
  );
  return mixed ? "자사, 입출고 구분, 통화가 같은 계근만 함께 등록할 수 있습니다." : "";
};

// 거래 등록 — 미배정 계근을 골라 하나의 거래로 묶는다
export function useWeighingRegister() {
  const { toast, showToast } = useToast();
  // 거래처 셀렉트 옵션 — /api/companies/options
  const companySearch = useCompanySearch();
  const [initialFilters] = useState(() => createInitialFilters(getLocalDateString()));
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  // 검색 조건·페이지를 바꿔도 선택이 유지되도록 id → 계근 으로 보관
  const [selected, setSelected] = useState({});
  const [confirm, setConfirm] = useState({ open: false, memo: "", allowMismatch: false, forceMismatch: false, submitting: false });
  // 이 화면에서 이번에 등록한 거래 요약(최신순) — 누르면 상세 모달을 연다
  const [registered, setRegistered] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const detailModal = useTransactionDetailModal(detailId);
  // 미배정 계근 수동 매핑 — 응답에 매핑 결과가 없어 목록 갱신은 하지 않는다
  const { openMapping, mappingModal } = useWeighingMapping(() => showToast("success", "매핑을 저장했습니다."));

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      fetchUnassignedWeighingRecords({
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        ownerCompany: filters.ownerCompany,
        tradeDirection: filters.tradeDirection,
        // 미배정 계근 API 는 원본 거래처명 부분검색만 지원하므로 선택한 거래처의 이름으로 검색한다
        counterpartyName: filters.companyName,
        vehicleNumber: filters.vehicleNumber,
        page,
        size: UNASSIGNED_PAGE_SIZE,
      })
        .then((response) => {
          if (!alive) return;
          // 페이지 순서가 서버 정렬 기준이므로 그대로 쓴다
          setRecords(response.content ?? []);
          setTotalCount(response.totalElements ?? 0);
          setTotalPages(response.totalPages || 1);
        })
        .catch((loadError) => {
          if (!alive) return;
          setRecords([]);
          setTotalCount(0);
          setTotalPages(1);
          setError(loadError.message || "미배정 계근을 불러오지 못했습니다.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters, page, retryCount]);

  const changeFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const selectedList = Object.values(selected);
  const selectionBlocker = getSelectionBlocker(selectedList);
  const counterpartyNames = [...new Set(selectedList.map((record) => (record.sourceCounterpartyName ?? "").trim()))];
  // 원본 거래처명이 서로 다르면 확인을 받는다. 서버가 내부 매핑 기준으로 다르다고 판단한 경우(forceMismatch)도 포함
  const counterpartyMismatch =
    new Set(selectedList.map((record) => normalizeName(record.sourceCounterpartyName))).size > 1 || confirm.forceMismatch;
  const accepted = sumWithMissing(selectedList.map((record) => record.acceptedWeightKg));
  const dates = selectedList.map((record) => record.weighingDate).filter(Boolean).sort();

  // 여러 계근을 한 번에 토글 — 전부 선택돼 있으면 해제, 아니면 모두 선택
  const toggleRecords = (targets) =>
    setSelected((current) => {
      const allSelected = targets.every((record) => current[record.weighingRecordId]);
      const next = { ...current };
      targets.forEach((record) => {
        if (allSelected) delete next[record.weighingRecordId];
        else next[record.weighingRecordId] = record;
      });
      return next;
    });

  const submit = async () => {
    if (selectionBlocker || (counterpartyMismatch && !confirm.allowMismatch)) return;
    setConfirm((current) => ({ ...current, submitting: true }));
    try {
      const result = await createTransaction({
        weighingRecordIds: selectedList.map((record) => record.weighingRecordId),
        allowCounterpartyMismatch: counterpartyMismatch && confirm.allowMismatch,
        memo: confirm.memo.trim() || null,
      });
      // 연속 등록 — 화면에 남아 선택을 비우고, 등록한 계근이 빠지도록 미배정 목록을 다시 받는다
      setRegistered((current) => [toRegisteredSummary(result), ...current]);
      setSelected({});
      setConfirm((current) => ({ ...current, open: false, submitting: false }));
      setRetryCount((current) => current + 1);
      showToast("success", `거래 #${result.transactionId}을(를) 등록했습니다.`);
    } catch (submitError) {
      if (submitError.code === STATE_CONFLICT_CODE && !confirm.allowMismatch) {
        // 원본명은 같아도 내부 매핑 거래처가 다른 경우 — 확인 체크를 받도록 전환
        setConfirm((current) => ({ ...current, submitting: false, forceMismatch: true }));
        return;
      }
      showToast("error", submitError.message || "거래를 등록하지 못했습니다.");
      setConfirm((current) => ({ ...current, submitting: false }));
      if (submitError.code === VERSION_CONFLICT_CODE) {
        // 이미 배정·삭제된 계근이 섞여 있음 — 선택을 비우고 목록을 새로 받는다
        setSelected({});
        setConfirm((current) => ({ ...current, open: false }));
        setRetryCount((current) => current + 1);
      }
    }
  };

  return {
    toolbar: {
      ...filters,
      companySearch,
      ownerCompanyOptions: OWNER_COMPANY_OPTIONS,
      tradeDirectionOptions: RECORD_TRADE_DIRECTION_OPTIONS,
      dateLimits: getDateRangeLimits(filters.startDate, filters.endDate),
      hasFilters: Object.entries(filters).some(([key, value]) => value !== initialFilters[key]),
      onDateRangeChange: (field, value) =>
        changeFilters(normalizeDateRangeChange({ startDate: filters.startDate, endDate: filters.endDate, field, value })),
      onFilterChange: (field, value) => changeFilters({ [field]: value }),
      onCompanyChange: (company) => changeFilters({ companyId: company.id ?? "", companyName: company.name ?? "" }),
      onReset: () => changeFilters(initialFilters),
    },
    list: {
      records,
      totalCount,
      loading,
      error,
      selectedIds: selected,
      onToggleRecords: toggleRecords,
      // 현재 페이지에서 같은 차량번호의 계근을 한 번에 선택
      onToggleVehicle: (vehicleNumber) => toggleRecords(records.filter((record) => record.vehicleNumber === vehicleNumber)),
      onMap: (record) =>
        openMapping({
          weighingRecordId: record.weighingRecordId,
          sourceCounterpartyName: record.sourceCounterpartyName,
          sourceItemName: record.sourceItemName,
          itemId: null,
          itemName: null,
        }),
      onRetry: () => setRetryCount((current) => current + 1),
    },
    pagination: {
      currentPage: page,
      totalPages,
      onPageChange: setPage,
    },
    selectionBar: {
      count: selectedList.length,
      blocker: selectedList.length > 0 ? selectionBlocker : "",
      onClear: () => setSelected({}),
      onOpenConfirm: () => setConfirm({ open: true, memo: "", allowMismatch: false, forceMismatch: false, submitting: false }),
    },
    confirmModal: {
      ...confirm,
      count: selectedList.length,
      records: selectedList,
      counterpartyNames,
      counterpartyMismatch,
      acceptedWeightKg: accepted.total,
      acceptedMissing: accepted.missing,
      dateFrom: dates[0] ?? null,
      dateTo: dates[dates.length - 1] ?? null,
      blocker: selectionBlocker,
      onMemoChange: (memo) => setConfirm((current) => ({ ...current, memo })),
      onAllowMismatchChange: (allowMismatch) => setConfirm((current) => ({ ...current, allowMismatch })),
      onSubmit: submit,
      onClose: () => setConfirm((current) => ({ ...current, open: false })),
    },
    registeredList: {
      items: registered,
      onOpen: setDetailId,
      onClear: () => setRegistered([]),
    },
    detailModal: {
      ...detailModal,
      onClose: () => setDetailId(null),
    },
    mappingModal,
    toast,
  };
}
