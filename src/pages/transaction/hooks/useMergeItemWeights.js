import { useEffect, useState } from "react";
import { fetchTransactionDetail } from "../api/transactionApi";
import { sumAcceptedWeightByItem } from "../constants";

// 거래에 포함된 항목 — 계근 거래는 계근 행, 수기 거래는 수기 품목
const rowsOf = (detail) => (detail.transactionOrigin === "WEIGHING" ? detail.weighingRecords : detail.manualItems) ?? [];

// 거래 합치기 모달용 품목별 총 중량 — 목록 응답에는 품목별 중량이 없어 선택한 거래의 상세를 받아 계산한다.
// transactionIds 가 비어 있으면(모달 닫힘) 조회하지 않는다.
export function useMergeItemWeights(transactionIds) {
  const key = transactionIds.join(",");
  // 어떤 거래 조합의 결과인지 함께 보관 — 현재 조합과 다르면 로딩 중으로 본다
  const [result, setResult] = useState({ key: null, details: [], error: "" });

  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    Promise.all(key.split(",").map((id) => fetchTransactionDetail(id)))
      .then((details) => {
        if (alive) setResult({ key, details, error: "" });
      })
      .catch((loadError) => {
        if (alive) setResult({ key, details: [], error: loadError.message || "품목별 중량을 불러오지 못했습니다." });
      });
    return () => {
      alive = false;
    };
  }, [key]);

  const current = result.key === key ? result : null;
  const details = current?.details ?? [];

  return {
    loading: Boolean(key) && !current,
    error: current?.error ?? "",
    // 거래 ID → 품목별 총 중량
    byTransaction: Object.fromEntries(details.map((detail) => [detail.transactionId, sumAcceptedWeightByItem(rowsOf(detail))])),
    // 합친 후 품목별 총 중량
    combined: sumAcceptedWeightByItem(details.flatMap(rowsOf)),
  };
}
