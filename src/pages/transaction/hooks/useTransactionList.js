import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { useToast } from "../../contract/hooks/useToast";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import { fetchTransactions, mergeTransactions } from "../api/transactionApi";
import { useTransactionDetailModal } from "./useTransactionDetailModal";
import {
  getLocalDateString,
  OWNER_COMPANY_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  TRADE_DIRECTION_OPTIONS,
  TRANSACTION_PAGE_SIZE,
  WARNING_OPTIONS,
} from "../constants";

const SEARCH_DEBOUNCE_MS = 300;

// 거래일은 오늘 하루, 나머지 필터는 매핑상태로 숨기지 않도록 기본값 '전체'
// (companyName 은 거래처 셀렉트 표시용이며 검색에는 companyId 만 보낸다)
const createInitialFilters = (today) => ({
  startDate: today,
  endDate: today,
  companyId: "",
  companyName: "",
  ownerCompany: "",
  tradeDirection: "",
  paymentStatus: "",
  hasWarning: "",
});

// 합칠 수 있는 거래 — 결제 완료(마감) 전 진행 중 거래
export const isMergeable = (transaction) => transaction.transactionStatus === "OPEN";

const normalizeName = (value) => (value ?? "").trim().toLocaleLowerCase("ko-KR");

const sameCounterparty = (a, b) =>
  a.companyId != null && b.companyId != null
    ? a.companyId === b.companyId
    : normalizeName(a.counterpartyName) === normalizeName(b.counterpartyName);

// 합치기 전 프론트 검증 — 서버 ensureCompatible 과 같은 조건
const getMergeIssues = (transactions, targetId) => {
  const target = transactions.find((transaction) => transaction.transactionId === targetId);
  if (!target) return { blocking: "", counterpartyMismatch: false };
  const others = transactions.filter((transaction) => transaction !== target);
  if (transactions.some((transaction) => !isMergeable(transaction))) {
    return { blocking: "결제 완료 전 진행 중 거래만 합칠 수 있습니다.", counterpartyMismatch: false };
  }
  if (others.some((transaction) => transaction.transactionOrigin !== target.transactionOrigin)) {
    return { blocking: "계근 거래와 수기 거래는 서로 합칠 수 없습니다.", counterpartyMismatch: false };
  }
  if (
    others.some(
      (transaction) =>
        transaction.ownerCompany !== target.ownerCompany ||
        transaction.tradeDirection !== target.tradeDirection ||
        transaction.currency !== target.currency
    )
  ) {
    return { blocking: "자사, 거래구분, 통화가 같은 거래만 합칠 수 있습니다.", counterpartyMismatch: false };
  }
  return { blocking: "", counterpartyMismatch: others.some((transaction) => !sameCounterparty(transaction, target)) };
};

export function useTransactionList() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  // 초기화 시에도 같은 기준일을 쓰도록 첫 렌더링 시점의 오늘 날짜를 고정한다
  const [initialFilters] = useState(() => createInitialFilters(getLocalDateString()));
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  // 페이지를 넘겨도 선택이 유지되도록 id → 목록 행 으로 보관 (합치기에 version 이 필요)
  const [selected, setSelected] = useState({});
  const [merge, setMerge] = useState({ open: false, targetId: null, reason: "", allowMismatch: false, submitting: false });
  // 상세 모달에 띄울 거래 ID — 결제정보가 저장되면 목록을 새로 받는다
  const [detailId, setDetailId] = useState(null);
  const detailModal = useTransactionDetailModal(detailId, () => setRetryCount((current) => current + 1));
  const companySearch = useCompanySearch();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      fetchTransactions({
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        companyId: filters.companyId,
        ownerCompany: filters.ownerCompany,
        tradeDirection: filters.tradeDirection,
        paymentStatus: filters.paymentStatus,
        hasWarning: filters.hasWarning,
        page,
        size: TRANSACTION_PAGE_SIZE,
      })
        .then((response) => {
          if (!alive) return;
          setTransactions(response.content ?? []);
          setTotalCount(response.totalElements ?? 0);
          setTotalPages(response.totalPages || 1);
        })
        .catch((loadError) => {
          if (!alive) return;
          setTransactions([]);
          setTotalCount(0);
          setTotalPages(1);
          setError(loadError.message || "거래 목록을 불러오지 못했습니다.");
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
    setSelected({});
  };

  const selectedList = Object.values(selected);
  const mergeIssues = getMergeIssues(selectedList, merge.targetId);

  const toggleSelect = (transaction) =>
    setSelected((current) => {
      const next = { ...current };
      if (next[transaction.transactionId]) delete next[transaction.transactionId];
      else next[transaction.transactionId] = transaction;
      return next;
    });

  const submitMerge = async () => {
    const target = selected[merge.targetId];
    if (!target || mergeIssues.blocking) return;
    if (mergeIssues.counterpartyMismatch && !merge.allowMismatch) return;
    setMerge((current) => ({ ...current, submitting: true }));
    try {
      const result = await mergeTransactions({
        targetTransactionId: target.transactionId,
        targetVersion: target.version,
        sources: selectedList
          .filter((transaction) => transaction.transactionId !== target.transactionId)
          .map((transaction) => ({ transactionId: transaction.transactionId, version: transaction.version })),
        allowCounterpartyMismatch: mergeIssues.counterpartyMismatch && merge.allowMismatch,
        reason: merge.reason.trim() || null,
      });
      // 성공 후 목록을 새로 받고 대상 거래 상세 모달을 연다
      setMerge((current) => ({ ...current, open: false, submitting: false }));
      setSelected({});
      setRetryCount((current) => current + 1);
      setDetailId(result.transactionId);
      showToast("success", "거래를 합쳤습니다.");
    } catch (mergeError) {
      showToast("error", mergeError.message || "거래를 합치지 못했습니다.");
      setMerge((current) => ({ ...current, submitting: false }));
      // 선택 행의 version 이 낡았을 수 있으므로 목록을 새로 받는다
      setSelected({});
      setRetryCount((current) => current + 1);
    }
  };

  return {
    toolbar: {
      ...filters,
      companySearch,
      ownerCompanyOptions: OWNER_COMPANY_OPTIONS,
      tradeDirectionOptions: TRADE_DIRECTION_OPTIONS,
      paymentStatusOptions: PAYMENT_STATUS_OPTIONS,
      warningOptions: WARNING_OPTIONS,
      dateLimits: getDateRangeLimits(filters.startDate, filters.endDate),
      hasFilters: Object.entries(filters).some(([key, value]) => value !== initialFilters[key]),
      onDateRangeChange: (field, value) =>
        changeFilters(normalizeDateRangeChange({ startDate: filters.startDate, endDate: filters.endDate, field, value })),
      onFilterChange: (field, value) => changeFilters({ [field]: value }),
      onCompanyChange: (company) => changeFilters({ companyId: company.id ?? "", companyName: company.name ?? "" }),
      onReset: () => changeFilters(initialFilters),
    },
    actions: {
      selectedCount: selectedList.length,
      canMerge: selectedList.length >= 2 && selectedList.every(isMergeable),
      onCreateManual: () => navigate("/transactions/new"),
      onOpenMerge: () =>
        setMerge({ open: true, targetId: selectedList[0]?.transactionId ?? null, reason: "", allowMismatch: false, submitting: false }),
      onClearSelection: () => setSelected({}),
    },
    list: {
      transactions,
      totalCount,
      loading,
      error,
      selectedIds: selected,
      onToggleSelect: toggleSelect,
      onOpenDetail: (transaction) => setDetailId(transaction.transactionId),
      onRetry: () => setRetryCount((current) => current + 1),
    },
    pagination: {
      currentPage: page,
      totalPages,
      onPageChange: setPage,
    },
    mergeModal: {
      ...merge,
      transactions: selectedList,
      blocking: mergeIssues.blocking,
      counterpartyMismatch: mergeIssues.counterpartyMismatch,
      onTargetChange: (targetId) => setMerge((current) => ({ ...current, targetId, allowMismatch: false })),
      onReasonChange: (reason) => setMerge((current) => ({ ...current, reason })),
      onAllowMismatchChange: (allowMismatch) => setMerge((current) => ({ ...current, allowMismatch })),
      onSubmit: submitMerge,
      onClose: () => setMerge((current) => ({ ...current, open: false })),
    },
    detailModal: {
      ...detailModal,
      onClose: () => setDetailId(null),
    },
    toast,
  };
}
