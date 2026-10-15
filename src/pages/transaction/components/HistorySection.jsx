import { formatDateTimeValue, HISTORY_ACTION_LABELS, labelOf, shortId } from "../constants";

function TransactionLink({ transactionId, onOpenTransaction }) {
  if (transactionId == null) return <span>-</span>;
  return (
    <button type="button" onClick={() => onOpenTransaction(transactionId)} className="font-semibold text-blue-600 hover:underline">
      #{transactionId}
    </button>
  );
}

// 거래 변경 이력 — 펼칠 때 조회한다.
export default function HistorySection({ open, loading, error, list, onToggle, onOpenTransaction }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between px-5 py-3 text-left">
        <h2 className="text-sm font-bold text-slate-700">변경 이력</h2>
        <span className="text-xs text-slate-400">{open ? "접기 ▲" : "펼치기 ▼"}</span>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">이력을 불러오는 중입니다.</p>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm text-red-500">{error}</p>
          ) : list.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">변경 이력이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-[13px]">
                <thead className="bg-slate-50 text-xs text-slate-400">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">처리시각</th>
                    <th className="px-3 py-2 text-left font-semibold">작업</th>
                    <th className="px-3 py-2 text-left font-semibold">이동 전 → 후</th>
                    <th className="px-3 py-2 text-left font-semibold">대상 계근</th>
                    <th className="px-3 py-2 text-left font-semibold">사유</th>
                    <th className="px-3 py-2 text-left font-semibold">작업자</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.map((entry) => (
                    <tr key={entry.historyId}>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">{formatDateTimeValue(entry.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">{labelOf(HISTORY_ACTION_LABELS, entry.actionType)}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                        {entry.fromTransactionId == null && entry.toTransactionId == null ? (
                          "-"
                        ) : (
                          <>
                            <TransactionLink transactionId={entry.fromTransactionId} onOpenTransaction={onOpenTransaction} />
                            {" → "}
                            <TransactionLink transactionId={entry.toTransactionId} onOpenTransaction={onOpenTransaction} />
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-600">{entry.weighingRecordId ? `#${entry.weighingRecordId}` : "-"}</td>
                      <td className="px-3 py-2 text-slate-600">{entry.reason || "-"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500" title={entry.changedBy ?? ""}>{shortId(entry.changedBy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
