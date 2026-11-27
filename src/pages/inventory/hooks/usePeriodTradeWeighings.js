import { useEffect, useState } from "react";
import { fetchPeriodTradeWeighings } from "../api/inventoryApi";
import { PERIOD_WEIGHING_PAGE_SIZE } from "../constants";

// 기간 통계 칸을 눌렀을 때 그 칸에 집계된 계근 목록을 불러온다
// target: { conditions, tradeDirection, itemIds, label, stat } — conditions 는 통계를 조회한 기간·자사·거래처
export function usePeriodTradeWeighings() {
  const [target, setTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: "" });

  const requestKey = target ? JSON.stringify([target, page, reloadKey]) : null;
  const loading = target != null && result.key !== requestKey;
  const data = loading ? null : result.data;
  const error = loading ? "" : result.error;

  useEffect(() => {
    if (!target) return undefined;
    let alive = true;
    fetchPeriodTradeWeighings({
      ...target.conditions,
      tradeDirection: target.tradeDirection,
      itemIds: target.itemIds,
      page,
      size: PERIOD_WEIGHING_PAGE_SIZE,
    })
      .then((response) => {
        if (alive) setResult({ key: requestKey, data: response, error: "" });
      })
      .catch((loadError) => {
        if (alive) setResult({ key: requestKey, data: null, error: loadError.message || "계근 목록을 불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [target, page, requestKey]);

  return {
    open: (nextTarget) => {
      setTarget(nextTarget);
      setPage(1);
    },
    modal: {
      open: target != null,
      target,
      loading,
      error,
      rows: data?.content ?? [],
      totalElements: data?.totalElements ?? 0,
      pagination: {
        totalPages: data?.totalPages ?? 0,
        currentPage: page,
        onPageChange: setPage,
      },
      onRetry: () => setReloadKey((current) => current + 1),
      onClose: () => setTarget(null),
    },
  };
}
