import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PAGE_SIZE } from "../constants";
import { fetchCompanies, fetchContracts, recalcPrices } from "../api/contractApi";
import { fetchMarketSummary } from "../api/marketApi";
import { ENUM_GROUPS } from "../api/enumsApi";
import { useEnums } from "./useEnums";
import { useToast } from "./useToast";

// 목록에서 쓰는 enum 그룹 (필터 옵션 + 코드→표시명 변환)
const LIST_ENUMS = [
  ENUM_GROUPS.OWNER_COMPANY,
  ENUM_GROUPS.CONTRACT_STATUS,
  ENUM_GROUPS.PRICE_TYPE,
];

export function useContractList() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const { enums, labelOf } = useEnums(LIST_ENUMS);

  // 필터 — "" = 전체(파라미터 미전송)
  const [ownerFilter, setOwnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [contracts, setContracts] = useState([]);
  const [companyMap, setCompanyMap] = useState({}); // customerId → 회사명
  const [market, setMarket] = useState({
    lme: { value: null, date: null },
    exchangeRate: { value: null, date: null },
    krwPerKg: null,
  });
  const [marketLoading, setMarketLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  // 시장 현황 (최근 LME·환율·원화환산)
  useEffect(() => {
    let alive = true;
    fetchMarketSummary()
      .then((m) => {
        if (!alive || !m) return;
        setMarket({ lme: m.lme, exchangeRate: m.exchangeRate, krwPerKg: m.krwPerKg });
      })
      .catch(() => {})
      .finally(() => alive && setMarketLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // 거래처 id→이름 매핑 (목록 응답은 customerId 만 주므로 회사명 표시에 필요)
  useEffect(() => {
    fetchCompanies()
      .then((list) => {
        const map = {};
        (list ?? []).forEach((c) => (map[c.id] = c.name));
        setCompanyMap(map);
      })
      .catch(() => {});
  }, []);

  const loadContracts = useCallback(async ({ owner, status, keyword, page: p }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchContracts({
        ownerCompany: owner || undefined,
        status: status || undefined,
        contractName: keyword || undefined,
        page: p,
        size: PAGE_SIZE,
      });
      setContracts(res.content ?? []);
      setTotalCount(res.totalElements ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      setError(e.message || "목록을 불러오지 못했습니다");
      setContracts([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts({ owner: ownerFilter, status: statusFilter, keyword: search, page });
  }, [loadContracts, ownerFilter, statusFilter, search, page]);

  const handleOwnerFilter = (owner) => {
    setOwnerFilter(owner);
    setPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleSearch = (keyword) => {
    setSearch(keyword);
    setPage(1);
  };

  // 재계산 — 당일 미확정 단가 재계산 후 목록 갱신
  const handleRecalculate = async () => {
    if (recalculating) return;
    setRecalculating(true);
    try {
      const res = await recalcPrices();
      await loadContracts({ owner: ownerFilter, status: statusFilter, keyword: search, page });
      showToast("success", `재계산이 완료되었습니다 (${res?.data?.recalculated ?? 0}건)`);
    } catch (e) {
      showToast("error", e.message || "재계산에 실패했습니다");
    } finally {
      setRecalculating(false);
    }
  };

  // 카드 뷰모델 — 목록 응답(대표 품목 기준 대표 단가 1건)을 화면 형태로 변환
  const cards = contracts.map((c) => ({
    id: c.contractId,
    name: c.contractName,
    contractNo: c.contractNo,
    company: companyMap[c.customerId] ?? "",
    ownerLabel: labelOf(ENUM_GROUPS.OWNER_COMPANY, c.ownerCompany),
    statusLabel: labelOf(ENUM_GROUPS.CONTRACT_STATUS, c.status),
    startDate: c.startDate,
    endDate: c.endDate,
    // 유형별 단가 목록 (finalUnitPrice 없으면 미정)
    prices: (c.prices ?? []).map((p) => ({
      priceId: p.priceId,
      label: p.priceTypeLabel || labelOf(ENUM_GROUPS.PRICE_TYPE, p.priceType),
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      rate: p.rate,
      value: p.finalUnitPrice ?? null,
    })),
  }));

  // 필터 옵션 (전체 + enum)
  const ownerOptions = [{ value: "", label: "전체" }, ...(enums[ENUM_GROUPS.OWNER_COMPANY] ?? [])];
  const statusOptions = [{ value: "", label: "전체" }, ...(enums[ENUM_GROUPS.CONTRACT_STATUS] ?? [])];

  return {
    market: {
      lme: market.lme,
      exchangeRate: market.exchangeRate,
      krwPerKg: market.krwPerKg,
      loading: marketLoading,
    },
    toolbar: {
      ownerFilter,
      onOwnerFilter: handleOwnerFilter,
      ownerOptions,
      statusFilter,
      onStatusFilter: handleStatusFilter,
      statusOptions,
      search,
      onSearch: handleSearch,
      recalculating,
      onRecalculate: handleRecalculate,
      onCreate: () => navigate("/contract/new"),
    },
    list: {
      contracts: cards,
      totalCount,
      loading,
      error,
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
