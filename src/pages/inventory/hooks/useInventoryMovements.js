import { useEffect, useMemo, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { useToast } from "../../contract/hooks/useToast";
import { useItemOptions } from "../../transaction/hooks/useItemOptions";
import { cancelMovement, fetchMovements } from "../api/inventoryApi";
import {
  addDays,
  getLocalDateString,
  MOVEMENT_PAGE_SIZE,
  MOVEMENT_TYPE_OPTIONS,
  OWNER_COMPANY_OPTIONS,
  REASON_MAX_LENGTH,
} from "../constants";
import { orderItemTree } from "../utils/itemTree";

const SEARCH_DEBOUNCE_MS = 300;

const createInitialFilters = (today) => ({
  startDate: addDays(today, -30),
  endDate: today,
  ownerCompany: "",
  itemId: "",
  movementType: "",
});

// 보정 내역 탭 — 조회와 취소
export function useInventoryMovements() {
  const [today] = useState(getLocalDateString);
  const [initialFilters] = useState(() => createInitialFilters(today));
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [movements, setMovements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const { toast, showToast } = useToast();
  const items = useItemOptions();
  const itemOptions = useMemo(() => orderItemTree(items), [items]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      fetchMovements({
        ownerCompany: filters.ownerCompany,
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        itemId: filters.itemId,
        movementType: filters.movementType,
        page,
        size: MOVEMENT_PAGE_SIZE,
      })
        .then((response) => {
          if (!alive) return;
          setMovements(response.content ?? []);
          setTotalCount(response.totalElements ?? 0);
          setTotalPages(response.totalPages ?? 1);
        })
        .catch((loadError) => {
          if (!alive) return;
          setMovements([]);
          setTotalCount(0);
          setTotalPages(1);
          setError(loadError.message || "보정 내역을 불러오지 못했습니다.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters, page, reloadKey]);

  const updateFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  const closeCancel = () => {
    if (canceling) return;
    setCancelTarget(null);
  };

  const submitCancel = async () => {
    if (!cancelTarget || canceling || cancelReason.length > REASON_MAX_LENGTH) return;
    setCanceling(true);
    setCancelError("");
    try {
      const response = await cancelMovement(cancelTarget.movementId, cancelReason.trim());
      showToast("success", response?.message ?? "재고 보정이 취소되었습니다.");
      setCancelTarget(null);
      setReloadKey((current) => current + 1);
    } catch (submitError) {
      setCancelError(submitError.message || "보정을 취소하지 못했습니다.");
    } finally {
      setCanceling(false);
    }
  };

  return {
    toolbar: {
      ...filters,
      ownerCompanyOptions: OWNER_COMPANY_OPTIONS,
      movementTypeOptions: MOVEMENT_TYPE_OPTIONS,
      itemOptions,
      dateLimits: getDateRangeLimits(filters.startDate, filters.endDate),
      hasFilters: JSON.stringify(filters) !== JSON.stringify(initialFilters),
      onDateRangeChange: (field, value) =>
        updateFilters(normalizeDateRangeChange({ startDate: filters.startDate, endDate: filters.endDate, field, value })),
      onOwnerCompanyChange: (value) => updateFilters({ ownerCompany: value }),
      onItemIdChange: (value) => updateFilters({ itemId: value }),
      onMovementTypeChange: (value) => updateFilters({ movementType: value }),
      onReset: () => {
        setFilters(initialFilters);
        setPage(1);
      },
    },
    list: {
      movements,
      totalCount,
      loading,
      error,
      onCancel: (movement) => {
        setCancelTarget(movement);
        setCancelReason("");
        setCancelError("");
      },
      onRetry: () => setReloadKey((current) => current + 1),
    },
    pagination: {
      currentPage: page,
      totalPages,
      onPageChange: setPage,
    },
    cancelModal: {
      target: cancelTarget,
      reason: cancelReason,
      submitting: canceling,
      error: cancelError,
      onReasonChange: setCancelReason,
      onSubmit: submitCancel,
      onClose: closeCancel,
    },
    toast,
  };
}
