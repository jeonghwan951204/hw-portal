import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../contract/hooks/useToast";
import { useItemOptions } from "../../transaction/hooks/useItemOptions";
import { createStockCount, fetchDailyTrades, fetchMovements, fetchStock } from "../api/inventoryApi";
import {
  addDays,
  DAILY_MOVEMENT_SIZE,
  getLocalDateString,
  MOVEMENT_OWNER_OPTIONS,
  OWNER_COMPANY_OPTIONS,
  parseQuantity,
  REASON_MAX_LENGTH,
} from "../constants";
import { orderItemTree, filterCollapsedRows, parentIdsOf } from "../utils/itemTree";
import { buildParentMap, buildStockSheet } from "../utils/stockSheet";
import { useMovementForm } from "./useMovementForm";

const SEARCH_DEBOUNCE_MS = 300;

// 재고 현황 탭 — 기준일·자사·품목 조건으로 전일/금일 재고, 그날 거래량, 그날 보정 내역을 함께 불러온다
export function useInventoryStock() {
  const [today] = useState(getLocalDateString);
  const [asOfDate, setAsOfDate] = useState(today);
  const [ownerCompany, setOwnerCompany] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set());
  const [countMode, setCountMode] = useState(false);
  const [actuals, setActuals] = useState({});
  const [countReason, setCountReason] = useState("");
  const [countSubmitting, setCountSubmitting] = useState(false);
  const { toast, showToast } = useToast();
  const items = useItemOptions();
  const itemOptions = useMemo(() => orderItemTree(items), [items]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      const condition = { ownerCompany, itemIds: selectedItemIds };
      Promise.all([
        fetchStock({ ...condition, asOfDate }),
        fetchStock({ ...condition, asOfDate: addDays(asOfDate, -1) }),
        fetchDailyTrades({ ...condition, date: asOfDate }),
        fetchMovements({ ownerCompany, dateFrom: asOfDate, dateTo: asOfDate, page: 1, size: DAILY_MOVEMENT_SIZE }),
      ])
        .then(([stock, prevStock, trades, movementPage]) => {
          if (!alive) return;
          setData({
            stock,
            prevStock,
            trades,
            movements: movementPage.content ?? [],
            movementsTruncated: (movementPage.totalElements ?? 0) > (movementPage.content ?? []).length,
          });
        })
        .catch((loadError) => {
          if (!alive) return;
          setData(null);
          setError(loadError.message || "재고 현황을 불러오지 못했습니다.");
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [asOfDate, ownerCompany, reloadKey, selectedItemIds]);

  const reload = () => setReloadKey((current) => current + 1);

  const parentMap = useMemo(() => buildParentMap(items, data?.stock?.items), [data, items]);
  const sheet = useMemo(
    () => (data ? buildStockSheet({ ...data, parentMap, selectedItemIds }) : null),
    [data, parentMap, selectedItemIds]
  );

  const stockItems = useMemo(() => data?.stock?.items ?? [], [data]);
  const ownStockMap = useMemo(
    () => new Map(stockItems.map((item) => [String(item.itemId), Number(item.ownQuantityKg ?? 0)])),
    [stockItems]
  );

  // 화면 재고와 자사·기준일이 같을 때만 자체 재고를 알 수 있다(품목 선택으로 빠진 품목은 모름)
  const ownStockOf = (owner, date, itemId) =>
    owner === ownerCompany && date === asOfDate ? ownStockMap.get(String(itemId)) ?? null : null;

  const movementForm = useMovementForm({ today, itemOptions, ownStockOf, showToast, onSaved: reload });

  // 보정은 자사 하나에만 속한다 — '전체' 조회 중이면 자사를 고르게 한다
  const defaultMovementOwner = ownerCompany || MOVEMENT_OWNER_OPTIONS[0].value;
  const openMovement = (mode, itemId) =>
    movementForm.open({ mode, ownerCompany: defaultMovementOwner, occurredDate: asOfDate, itemId: itemId == null ? "" : String(itemId) });

  const resetCount = () => {
    setActuals({});
    setCountReason("");
  };

  const countEntries = Object.entries(actuals)
    .map(([itemId, value]) => ({ itemId, actualQuantityKg: parseQuantity(value) }))
    .filter((entry) => entry.actualQuantityKg != null);
  const countBlocker = (() => {
    if (!ownerCompany) return "재고 확인은 자사를 선택한 뒤 입력할 수 있습니다.";
    if (asOfDate > today) return "미래 날짜는 재고 확인할 수 없습니다.";
    if (countEntries.length === 0) return "실제 수량을 입력한 품목이 없습니다.";
    if (countEntries.some((entry) => entry.actualQuantityKg < 0)) return "실제 수량은 0 이상이어야 합니다.";
    if (countReason.length > REASON_MAX_LENGTH) return `사유는 ${REASON_MAX_LENGTH}자 이하로 입력하세요.`;
    return "";
  })();

  const submitCount = async () => {
    if (countBlocker || countSubmitting) return;
    setCountSubmitting(true);
    try {
      const response = await createStockCount({
        ownerCompany,
        occurredDate: asOfDate,
        items: countEntries.map((entry) => ({ itemId: Number(entry.itemId), actualQuantityKg: entry.actualQuantityKg })),
        reason: countReason.trim() || null,
      });
      const results = response?.data?.items ?? [];
      const adjusted = results.filter((result) => result.movementId != null).length;
      showToast("success", `재고 확인 반영 — ${adjusted}개 품목 보정, ${results.length - adjusted}개 품목 일치`);
      resetCount();
      setCountMode(false);
      reload();
    } catch (submitError) {
      showToast("error", submitError.message || "재고 확인을 반영하지 못했습니다.");
    } finally {
      setCountSubmitting(false);
    }
  };

  const changeCondition = (apply) => {
    apply();
    resetCount();
  };

  const parentIds = parentIdsOf(stockItems);

  return {
    toolbar: {
      asOfDate,
      today,
      ownerCompany,
      ownerCompanyOptions: OWNER_COMPANY_OPTIONS,
      itemOptions,
      selectedItemIds,
      hasFilters: asOfDate !== today || Boolean(ownerCompany) || selectedItemIds.length > 0,
      onAsOfDateChange: (value) => changeCondition(() => setAsOfDate(value || today)),
      onOwnerCompanyChange: (value) => changeCondition(() => setOwnerCompany(value)),
      onSelectedItemIdsChange: (ids) => changeCondition(() => setSelectedItemIds(ids)),
      onReset: () =>
        changeCondition(() => {
          setAsOfDate(today);
          setOwnerCompany("");
          setSelectedItemIds([]);
        }),
    },
    status: {
      loading,
      error,
      onRetry: reload,
    },
    unmapped: {
      unmapped: data?.stock?.unmapped ?? null,
    },
    sheet: {
      sheet,
      asOfDate,
      ownerCompany,
      movementsTruncated: data?.movementsTruncated ?? false,
    },
    itemTable: {
      rows: filterCollapsedRows(stockItems, collapsedIds),
      parentIds,
      collapsedIds,
      countMode,
      countAvailable: Boolean(ownerCompany),
      actuals,
      countReason,
      countBlocker,
      countSubmitting,
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
      onToggleCountMode: () => {
        setCountMode((current) => !current);
        resetCount();
      },
      onActualChange: (itemId, value) => setActuals((current) => ({ ...current, [String(itemId)]: value })),
      onCountReasonChange: setCountReason,
      onSubmitCount: submitCount,
      onOpenTransfer: (itemId) => openMovement("TRANSFER", itemId),
      onOpenAdjustment: (itemId) => openMovement("ADJUSTMENT", itemId),
    },
    actions: {
      onOpenTransfer: () => openMovement("TRANSFER"),
      onOpenAdjustment: () => openMovement("ADJUSTMENT"),
    },
    movementModal: movementForm.modal,
    toast,
  };
}
