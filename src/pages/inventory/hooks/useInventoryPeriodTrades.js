import { useEffect, useMemo, useState } from "react";
import { getDateRangeLimits, normalizeDateRangeChange } from "../../../utils/validate";
import { useCompanySearch } from "../../contract/hooks/useCompanySearch";
import { useItemOptions } from "../../transaction/hooks/useItemOptions";
import { fetchPeriodTrades } from "../api/inventoryApi";
import { getLocalDateString, OWNER_COMPANY_OPTIONS } from "../constants";
import { filterCollapsedRows, orderItemTree, parentIdsOf, sortStockItemsByItemOrder } from "../utils/itemTree";

const SEARCH_DEBOUNCE_MS = 300;

// 기본 조회 기간은 이번 달 1일 ~ 오늘 (서버 기본값과 같다)
// (companyName 은 거래처 셀렉트 표시용이며 검색에는 companyId 만 보낸다)
const createInitialFilters = (today) => ({
  startDate: `${today.slice(0, 8)}01`,
  endDate: today,
  ownerCompany: "",
  companyId: "",
  companyName: "",
  itemIds: [],
});

// 기간 통계 탭 — 기간·자사·거래처·품목 조건으로 품목별 매입/매출 수량과 평균 단가를 불러온다
export function useInventoryPeriodTrades() {
  const [today] = useState(getLocalDateString);
  const [initialFilters] = useState(() => createInitialFilters(today));
  const [filters, setFilters] = useState(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);
  // 어떤 조건의 결과인지 함께 보관 — 현재 조건과 다르면 로딩 중으로 본다
  const [result, setResult] = useState({ key: null, data: null, error: "" });
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const companySearch = useCompanySearch();
  const items = useItemOptions();
  const itemOptions = useMemo(() => orderItemTree(items), [items]);

  const requestKey = JSON.stringify([filters, reloadKey]);
  const loading = result.key !== requestKey;
  const data = loading ? null : result.data;
  const error = loading ? "" : result.error;

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      fetchPeriodTrades({
        dateFrom: filters.startDate,
        dateTo: filters.endDate,
        ownerCompany: filters.ownerCompany,
        companyId: filters.companyId,
        itemIds: filters.itemIds,
      })
        .then((response) => {
          if (alive) setResult({ key: requestKey, data: response, error: "" });
        })
        .catch((loadError) => {
          if (alive) {
            setResult({ key: requestKey, data: null, error: loadError.message || "기간 통계를 불러오지 못했습니다." });
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [filters, requestKey]);

  const updateFilters = (patch) => setFilters((current) => ({ ...current, ...patch }));

  // 품목 행은 재고 현황과 같이 품목 API(/api/items) 응답 순서를 따른다
  const rows = useMemo(() => sortStockItemsByItemOrder(data?.items ?? [], items), [data, items]);
  const parentIds = parentIdsOf(rows);

  return {
    toolbar: {
      ...filters,
      today,
      ownerCompanyOptions: OWNER_COMPANY_OPTIONS,
      companySearch,
      itemOptions,
      dateLimits: getDateRangeLimits(filters.startDate, filters.endDate),
      hasFilters: JSON.stringify(filters) !== JSON.stringify(initialFilters),
      onDateRangeChange: (field, value) =>
        updateFilters(normalizeDateRangeChange({ startDate: filters.startDate, endDate: filters.endDate, field, value })),
      onOwnerCompanyChange: (value) => updateFilters({ ownerCompany: value }),
      onCompanyChange: (company) => updateFilters({ companyId: company.id ?? "", companyName: company.name ?? "" }),
      onSelectedItemIdsChange: (ids) => updateFilters({ itemIds: ids }),
      onReset: () => setFilters(initialFilters),
    },
    unmapped: {
      unmapped: loading || error ? null : data?.unmapped ?? null,
      target: "기간 통계",
    },
    table: {
      loading,
      error,
      dateFrom: data?.dateFrom ?? filters.startDate,
      dateTo: data?.dateTo ?? filters.endDate,
      rows: filterCollapsedRows(rows, collapsedIds),
      parentIds,
      collapsedIds,
      totalPurchase: data?.totalPurchase ?? null,
      totalSale: data?.totalSale ?? null,
      onToggleCollapse: (itemId) =>
        setCollapsedIds((current) => {
          const next = new Set(current);
          const key = String(itemId);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
        }),
      onExpandAll: () => setCollapsedIds(new Set()),
      onCollapseAll: () => setCollapsedIds(new Set(parentIds)),
      onRetry: () => setReloadKey((current) => current + 1),
    },
  };
}
