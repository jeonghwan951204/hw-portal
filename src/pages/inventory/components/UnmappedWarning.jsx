import { Link } from "react-router-dom";
import { formatKg } from "../constants";

// 품목 미매핑 계근은 재고·기간 통계에서 빠진다 — 건수가 있으면 경고와 계근 매핑 화면 링크를 보여 준다
export default function UnmappedWarning({ unmapped, target = "재고" }) {
  const purchaseCount = unmapped?.purchaseCount ?? 0;
  const saleCount = unmapped?.saleCount ?? 0;
  const count = purchaseCount + saleCount;
  if (count === 0) return null;

  const quantity = Number(unmapped.purchaseQuantityKg ?? 0) + Number(unmapped.saleQuantityKg ?? 0);
  const parts = [
    purchaseCount > 0 && `매입 ${purchaseCount}건 ${formatKg(unmapped.purchaseQuantityKg)} kg`,
    saleCount > 0 && `매출 ${saleCount}건 ${formatKg(unmapped.saleQuantityKg)} kg`,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p>
        품목 미매핑 계근 <b>{count}건({formatKg(quantity)} kg)</b>은 {target}에 반영되지 않았습니다.
        <span className="ml-1 text-xs text-amber-700">({parts.join(" · ")})</span>
      </p>
      <Link
        to="/transactions/new"
        className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
      >
        계근 매핑하러 가기
      </Link>
    </div>
  );
}
