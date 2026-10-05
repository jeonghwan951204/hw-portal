import { useCallback, useEffect, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { PAGE_SIZE } from "../constants";
import { fetchContractTransactions } from "../api/contractApi";
import { useCompanySearch } from "./useCompanySearch";

const EMPTY_FILTERS = { startDate: "", endDate: "", customerId: "" };

export function useAllTransactions(active) {
  const companySearch = useCompanySearch(active);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const [contractGroups, setContractGroups] = useState([]);
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
      setContractGroups(response.content ?? []);
      setTotalCount(response.totalElements ?? 0);
      setTotalPages(Math.max(1, response.totalPages ?? 1));
    } catch (loadError) {
      setContractGroups([]);
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
    setSelectedCompanyName("");
    companySearch.onKeywordChange("");
    setPage(1);
  };

  const handleCompanySelect = (company) => {
    setFilters((current) => ({
      ...current,
      customerId: company.id === "" ? "" : String(company.id),
    }));
    setSelectedCompanyName(company.name ?? "");
  };

  return {
    filters: {
      ...filters,
      dateLimits: getDateRangeLimits(filters.startDate, filters.endDate),
      hasFilters: Boolean(
        filters.startDate ||
          filters.endDate ||
          filters.customerId ||
          appliedFilters.startDate ||
          appliedFilters.endDate ||
          appliedFilters.customerId ||
          companySearch.keyword
      ),
      onDateRangeChange: handleDateRangeChange,
      companySelect: {
        ...companySearch,
        value: filters.customerId,
        selectedName: selectedCompanyName,
        onSelect: handleCompanySelect,
      },
      onSearch: handleSearch,
      onReset: handleReset,
    },
    list: {
      contractGroups,
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
