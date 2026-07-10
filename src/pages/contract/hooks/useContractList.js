import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PAGE_SIZE } from "../constants";
import { MOCK_CONTRACTS, MOCK_MARKET } from "../mockData";
import { useToast } from "./useToast";

// 임시 서버 흉내 — TODO: API 연동 시 apiFetch 호출로 교체.
// 필터·검색·페이지네이션은 서버 책임이므로, 연동 시 이 함수만 통째로 대체하면 된다.
const fetchContractsMock = ({ status, keyword, page }) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const filtered = MOCK_CONTRACTS.filter((c) => {
        const matchStatus = status === "전체" || c.status === status;
        const matchKeyword =
          !keyword ||
          c.name.toLowerCase().includes(keyword.toLowerCase()) ||
          (c.contractNo ?? "").toLowerCase().includes(keyword.toLowerCase()) ||
          c.company.toLowerCase().includes(keyword.toLowerCase());
        return matchStatus && matchKeyword;
      });
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      resolve({
        contracts: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        totalCount: filtered.length,
        totalPages,
      });
    }, 300);
  });

export function useContractList() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [contracts, setContracts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const loadContracts = useCallback(async ({ status, keyword, page: p }) => {
    setLoading(true);
    const res = await fetchContractsMock({ status, keyword, page: p });
    setContracts(res.contracts);
    setTotalCount(res.totalCount);
    setTotalPages(res.totalPages);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadContracts({ status: statusFilter, keyword: search, page });
  }, [loadContracts, statusFilter, search, page]);

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearch = (keyword) => {
    setSearch(keyword);
    setPage(1);
  };

  // 재계산 — 서버에 요청하고 완료 후 목록 갱신 (임시로 지연만 흉내)
  const handleRecalculate = async () => {
    if (recalculating) return;
    setRecalculating(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setRecalculating(false);
    await loadContracts({ status: statusFilter, keyword: search, page });
    showToast("success", "재계산이 완료되었습니다");
  };

  return {
    market: {
      lme: MOCK_MARKET.lme,
      exchangeRate: MOCK_MARKET.exchangeRate,
    },
    toolbar: {
      statusFilter,
      onStatusFilter: handleStatusFilter,
      search,
      onSearch: handleSearch,
      recalculating,
      onRecalculate: handleRecalculate,
      onCreate: () => navigate("/contract/new"),
    },
    list: {
      contracts,
      totalCount,
      loading,
      onCardClick: (id) => navigate(`/contract/${id}`),
      onCreate: () => navigate("/contract/new"),
    },
    pagination: {
      currentPage: page,
      totalPages,
      onPageChange: setPage,
    },
    toast,
  };
}
