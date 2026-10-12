import { useEffect, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { fetchWeighings } from "../api/weighingApi";
import {
  getLocalDateString,
  OWNER_COMPANY_OPTIONS,
  TRADE_DIRECTION_OPTIONS,
  WEIGHING_PAGE_SIZE,
} from "../constants";

const SEARCH_DEBOUNCE_MS = 300;

export function useWeighingList() {
  const [today] = useState(getLocalDateString);
  const [weighings, setWeighings] = useState([]);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [companyName, setCompanyName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [tradeDirection, setTradeDirection] = useState("");
  const [ownerCompany, setOwnerCompany] = useState("HOJAE");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      fetchWeighings({
        dateFrom: startDate,
        dateTo: endDate,
        counterpartyName: companyName,
        vehicleNumber,
        tradeDirection,
        ownerCompany,
        page,
        size: WEIGHING_PAGE_SIZE,
      })
        .then((response) => {
          if (!alive) return;
          setWeighings(response.content ?? []);
          setTotalCount(response.totalElements ?? 0);
          setTotalPages(response.totalPages ?? 1);
        })
        .catch((loadError) => {
          if (!alive) return;
          setWeighings([]);
          setTotalCount(0);
          setTotalPages(1);
          setError(loadError.message || "계근 목록을 불러오지 못했습니다.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [companyName, endDate, ownerCompany, page, retryCount, startDate, tradeDirection, vehicleNumber]);

  const handleDateRangeChange = (field, value) => {
    const nextRange = normalizeDateRangeChange({ startDate, endDate, field, value });
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
    setPage(1);
    setExpandedId(null);
  };

  const resetFilters = () => {
    setStartDate(today);
    setEndDate(today);
    setCompanyName("");
    setVehicleNumber("");
    setTradeDirection("");
    setOwnerCompany("HOJAE");
    setPage(1);
    setExpandedId(null);
  };

  return {
    toolbar: {
      startDate,
      endDate,
      companyName,
      vehicleNumber,
      tradeDirection,
      ownerCompany,
      tradeDirectionOptions: TRADE_DIRECTION_OPTIONS,
      ownerCompanyOptions: OWNER_COMPANY_OPTIONS,
      dateLimits: getDateRangeLimits(startDate, endDate),
      hasFilters: Boolean(
        startDate !== today ||
        endDate !== today ||
        companyName ||
        vehicleNumber ||
        tradeDirection ||
        ownerCompany !== "HOJAE"
      ),
      onDateRangeChange: handleDateRangeChange,
      onCompanyNameChange: (value) => {
        setCompanyName(value);
        setPage(1);
        setExpandedId(null);
      },
      onVehicleNumberChange: (value) => {
        setVehicleNumber(value);
        setPage(1);
        setExpandedId(null);
      },
      onTradeDirectionChange: (value) => {
        setTradeDirection(value);
        setPage(1);
        setExpandedId(null);
      },
      onOwnerCompanyChange: (value) => {
        setOwnerCompany(value);
        setPage(1);
        setExpandedId(null);
      },
      onReset: resetFilters,
    },
    list: {
      weighings,
      totalCount,
      loading,
      error,
      expandedId,
      onToggleDetail: (id) => setExpandedId((current) => (current === id ? null : id)),
      onRetry: () => setRetryCount((current) => current + 1),
    },
    pagination: {
      currentPage: page,
      totalPages,
      onPageChange: (nextPage) => {
        setPage(nextPage);
        setExpandedId(null);
      },
    },
  };
}
