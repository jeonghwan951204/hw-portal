import { Badge } from "../../transaction/components/Badges";
import { formatDate, formatKg, movementTypeLabelOf, ownerCompanyLabelOf } from "../constants";

const TYPE_TONES = { ADJUSTMENT_INCREASE: "blue", ADJUSTMENT_DECREASE: "violet", TRANSFER: "emerald" };

// 이동은 'A동 → 밀베리', 증가는 도착 품목, 감소는 출발 품목
const targetOf = (movement) => {
  if (movement.movementType === "TRANSFER") return `${movement.fromItemName ?? "-"} → ${movement.toItemName ?? "-"}`;
  return (movement.movementType === "ADJUSTMENT_INCREASE" ? movement.toItemName : movement.fromItemName) ?? "-";
};

const signOf = (movement) =>
  movement.movementType === "ADJUSTMENT_INCREASE" ? "+" : movement.movementType === "ADJUSTMENT_DECREASE" ? "-" : "";

function StatusBadges({ movement }) {
  return (
    <div className="flex flex-wrap gap-1">
      {movement.canceledByMovementId != null && <Badge tone="slate">취소됨</Badge>}
      {movement.reversalOfId != null && <Badge tone="red">취소 #{movement.reversalOfId}</Badge>}
    </div>
  );
}

function CancelButton({ movement, onCancel }) {
  // 취소 내역은 다시 취소할 수 없어 버튼을 숨기고, 이미 취소된 내역은 비활성
  if (movement.reversalOfId != null) return null;
  const canceled = movement.canceledByMovementId != null;
  return (
    <button
      type="button"
      onClick={() => onCancel(movement)}
      disabled={canceled}
      className="rounded-md border border-red-200 px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      취소
    </button>
  );
}

export default function MovementList({ movements, totalCount, loading, error, onCancel, onRetry }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        보정 내역을 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="text-sm font-bold text-slate-700">보정 내역</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">{totalCount}건</span>
      </div>

      {movements.length === 0 ? (
        <p className="px-5 py-14 text-center text-sm text-slate-400">검색 조건에 맞는 보정 내역이 없습니다.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[60rem] table-fixed text-[13px]">
              <thead className="bg-slate-50 text-xs text-slate-400">
                <tr>
                  <th className="w-[6%] px-3 py-2 text-left font-semibold">번호</th>
                  <th className="w-[10%] px-3 py-2 text-left font-semibold">발생일</th>
                  <th className="w-[7%] px-3 py-2 text-left font-semibold">자사</th>
                  <th className="w-[10%] px-3 py-2 text-left font-semibold">유형</th>
                  <th className="w-[19%] px-3 py-2 text-left font-semibold">품목</th>
                  <th className="w-[11%] px-3 py-2 text-right font-semibold">수량(kg)</th>
                  <th className="px-3 py-2 text-left font-semibold">사유</th>
                  <th className="w-[13%] px-3 py-2 text-left font-semibold">작업자</th>
                  <th className="w-[6%] px-3 py-2" aria-label="취소" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map((movement) => (
                  <tr key={movement.movementId} className={movement.canceledByMovementId != null ? "text-slate-400" : "text-slate-700"}>
                    <td className="px-3 py-2.5 tabular-nums">#{movement.movementId}</td>
                    <td className="px-3 py-2.5">{formatDate(movement.occurredDate)}</td>
                    <td className="px-3 py-2.5">{ownerCompanyLabelOf(movement.ownerCompany)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={TYPE_TONES[movement.movementType]}>{movementTypeLabelOf(movement.movementType)}</Badge>
                        <StatusBadges movement={movement} />
                      </div>
                    </td>
                    <td className="truncate px-3 py-2.5 font-medium" title={targetOf(movement)}>{targetOf(movement)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {signOf(movement)}
                      {formatKg(movement.quantityKg)}
                    </td>
                    <td className="truncate px-3 py-2.5 text-slate-500" title={movement.reason}>{movement.reason || "-"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-500">
                      <div>{movement.createdByName ?? "-"}</div>
                      <div className="text-[11px] text-slate-400">{movement.createdAt ? movement.createdAt.replace("T", " ").slice(0, 16) : "-"}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <CancelButton movement={movement} onCancel={onCancel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-slate-100 md:hidden">
            {movements.map((movement) => (
              <li key={movement.movementId} className="space-y-1.5 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge tone={TYPE_TONES[movement.movementType]}>{movementTypeLabelOf(movement.movementType)}</Badge>
                    <StatusBadges movement={movement} />
                    <span className="text-xs text-slate-400">
                      #{movement.movementId} · {formatDate(movement.occurredDate)} · {ownerCompanyLabelOf(movement.ownerCompany)}
                    </span>
                  </div>
                  <CancelButton movement={movement} onCancel={onCancel} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-slate-700">{targetOf(movement)}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {signOf(movement)}
                    {formatKg(movement.quantityKg)} kg
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {movement.reason || "-"} · {movement.createdByName ?? "-"}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
