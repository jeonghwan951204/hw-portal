import { useCallback, useEffect, useMemo, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { PAGE_SIZE } from "../constants";
import { fetchContractTransactions } from "../api/contractApi";
import { ENUM_GROUPS } from "../api/enumsApi";
import { useEnums } from "./useEnums";

const EMPTY_FILTERS = { startDate: "", endDate: "", ownerCompany: "" };

export function useAllTransactions(active) {
  const { enums, labelOf } = useEnums([ENUM_GROUPS.OWNER_COMPANY]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetchContractTransactions({
        ...appliedFilters,
        page,
        size: PAGE_SIZE,
      });
      setTransactions(response.content ?? []);
      setTotalCount(response.totalElements ?? 0);
      setTotalPages(Math.max(1, response.totalPages ?? 1));
    } catch (loadError) {
      setTransactions([]);
      setTotalCount(0);
      setTotalPages(1);
      setError(loadError.message || "전체 거래내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    if (active) loadTransactions();
  }, [active, loadTransactions]);

  const transactionRows = useMemo(
    () =>
      transactions.map((transaction) => ({
        ...transaction,
        ownerLabel: labelOf(ENUM_GROUPS.OWNER_COMPANY, transaction.ownerCompany),
      })),
    [labelOf, transactions]
  );

  const handleDateRangeChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      ...normalizeDateRangeChange({
        startDate: current.startDate,
        endDate: current.endDate,
        field,
        value,
      }),
    }));
  };

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  return {
    filters: {
      ...filters,
      dateLimits: getDateRangeLimits(filters.startDate, filters.endDate),
      hasFilters: Boolean(
        filters.startDate ||
          filters.endDate ||
          filters.ownerCompany ||
          appliedFilters.startDate ||
          appliedFilters.endDate ||
          appliedFilters.ownerCompany
      ),
      onDateRangeChange: handleDateRangeChange,
      ownerOptions: enums[ENUM_GROUPS.OWNER_COMPANY] ?? [],
      onCompanyChange: (ownerCompany) =>
        setFilters((current) => ({ ...current, ownerCompany })),
      onSearch: handleSearch,
      onReset: handleReset,
    },
    list: {
      transactions: transactionRows,
      totalCount,
      loading,
      error,
      onRetry: loadTransactions,
    },
    pagination: {
      currentPage: page,
      totalPages,
      onPageChange: setPage,
    },
  };
}
