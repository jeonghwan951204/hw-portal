import Button from "../../../components/Button";
import Modal from "../../../components/Modal";
import Pagination from "../../../components/Pagination";
import { formatAveragePrice, formatDate, formatKg, ownerCompanyLabelOf } from "../constants";
import { formatNumber } from "../../weighing/constants";

const DIRECTION_LABELS = { PURCHASE: "매입 (입고)", SALE: "매출 (출고)" };

// 10:32:05 → 10:32
const formatTime = (value) => (value ? value.slice(0, 5) : "");

// 조회 조건 요약 — 기간 · 자사 · 거래처
function ConditionSummary({ target }) {
  const { conditions, companyName } = target;
  const parts = [
    `${formatDate(conditions.dateFrom)} ~ ${formatDate(conditions.dateTo)}`,
    conditions.ownerCompany ? ownerCompanyLabelOf(conditions.ownerCompany) : "자사 전체",
    conditions.companyId ? companyName || `거래처 #${conditions.companyId}` : "거래처 전체",
  ];
  return parts.join(" · ");
}

// 클릭한 칸의 통계 — 목록 합계와 같은 값
function StatSummary({ stat }) {
  const unpriced = Number(stat?.unpricedQuantityKg ?? 0);
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
      <span>
        수량 <b className="text-sm tabular-nums text-slate-800">{formatKg(stat?.quantityKg)}</b> kg
      </span>
      <span>
        건수 <b className="text-sm tabular-nums text-slate-800">{stat?.weighingCount ?? 0}</b>건
      </span>
      <span>
        평균 단가 <b className="text-sm tabular-nums text-slate-800">{formatAveragePrice(stat?.averageUnitPrice)}</b> 원/kg
      </span>
      {unpriced !== 0 && <span className="text-amber-600">단가 없음 {formatKg(unpriced)} kg</span>}
    </div>
  );
}

function WeighingTable({ rows, tradeDirection }) {
  const priceQuantityLabel = tradeDirection === "PURCHASE" ? "인수량(kg)" : "단가 수량(kg)";
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[56rem] text-[13px]">
        <thead className="bg-slate-50 text-xs text-slate-400">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">계량일</th>
            <th className="px-3 py-2 text-left font-semibold">자사</th>
            <th className="px-3 py-2 text-left font-semibold">거래처</th>
            <th className="px-3 py-2 text-left font-semibold">품목</th>
            <th className="px-3 py-2 text-left font-semibold">차량번호</th>
            <th className="px-3 py-2 text-right font-semibold">실중량(kg)</th>
            <th className="px-3 py-2 text-right font-semibold">{priceQuantityLabel}</th>
            <th className="px-3 py-2 text-right font-semibold">단가(원/kg)</th>
            <th className="px-3 py-2 text-right font-semibold">금액(원)</th>
            <th className="px-3 py-2 text-left font-semibold">거래</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.weighingRecordId} className="hover:bg-slate-50/60">
              <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                {formatDate(row.weighingDate)}
                {row.secondWeighedAt && <span className="ml-1 text-[11px] text-slate-400">{formatTime(row.secondWeighedAt)}</span>}
              </td>
              <td className="whitespace-nowrap px-3 py-2">{ownerCompanyLabelOf(row.ownerCompany)}</td>
              <td className="px-3 py-2">
                {row.companyName ?? <span className="text-slate-300">거래처 미입력</span>}
                {row.companyId == null && (
                  <span className="ml-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">미매핑</span>
                )}
              </td>
              <td className="px-3 py-2">{row.itemName}</td>
              <td className="whitespace-nowrap px-3 py-2">{row.vehicleNumber}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatKg(row.netWeightKg)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                {row.priceQuantityKg == null ? "-" : formatKg(row.priceQuantityKg)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.unitPrice == null ? (
                  <span className="text-[12px] text-amber-600">단가 없음</span>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800">{formatAveragePrice(row.unitPrice)}</span>
                    {row.saleLineApplied && (
                      <div className="text-[10px] text-slate-400" title="정산 줄(매출 줄)의 수량·단가로 계산한 평균 단가">
                        매출 줄 평균
                      </div>
                    )}
                  </>
                )}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{row.amount == null ? "-" : formatNumber(row.amount)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                {row.transactionId == null ? <span className="text-slate-300">미배정</span> : `#${row.transactionId}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 기간 통계 칸의 계근 목록 — 품목(하위 포함) × 매입/매출
export default function PeriodTradeWeighingModal({
  open,
  target,
  loading,
  error,
  rows,
  totalElements,
  pagination,
  onRetry,
  onClose,
}) {
  if (!open || !target) return null;

  let body;
  if (loading) {
    body = <p className="py-12 text-center text-sm text-slate-400">계근 목록을 불러오는 중입니다.</p>;
  } else if (error) {
    body = (
      <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-8 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="dangerOutline" size="sm" className="mt-4" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    );
  } else if (rows.length === 0) {
    body = <p className="py-12 text-center text-sm text-slate-400">해당 조건의 계근이 없습니다.</p>;
  } else {
    body = (
      <>
        <p className="text-xs text-slate-400">총 {totalElements}건 · 최근 계근 순</p>
        <WeighingTable rows={rows} tradeDirection={target.tradeDirection} />
        <Pagination {...pagination} />
      </>
    );
  }

  return (
    <Modal
      title={`${target.label} · ${DIRECTION_LABELS[target.tradeDirection] ?? target.tradeDirection} 계근 목록`}
      description={<ConditionSummary target={target} />}
      size="xl"
      onClose={onClose}
      footer={
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <StatSummary stat={target.stat} />
      {body}
    </Modal>
  );
}
