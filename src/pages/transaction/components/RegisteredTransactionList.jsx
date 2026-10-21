import { formatWeight, labelOf, ownerCompanyLabelOf, TRADE_DIRECTION_LABELS } from "../constants";
import { Badge, MappedName } from "./Badges";

// 연속 등록 결과 — 이 화면에서 이번에 등록한 거래(최신순). 누르면 상세 모달을 연다.
export default function RegisteredTransactionList({ items, onOpen, onClear }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-emerald-700">이번에 등록한 거래 ({items.length})</h2>
        <button type="button" onClick={onClear} className="text-xs font-semibold text-slate-400 hover:text-slate-600">
          목록 지우기
        </button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const tone = { PURCHASE: "blue", SALE: "violet", UNKNOWN: "amber" }[item.tradeDirection];
          return (
            <li key={item.transactionId}>
              <button
                type="button"
                onClick={() => onOpen(item.transactionId)}
                title="누르면 거래 상세를 엽니다"
                className="flex max-w-xs items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-left text-xs hover:border-emerald-400 hover:bg-emerald-50"
              >
                <span className="font-mono text-slate-400">#{item.transactionId}</span>
                <Badge tone={tone}>
                  {ownerCompanyLabelOf(item.ownerCompany)}-{labelOf(TRADE_DIRECTION_LABELS, item.tradeDirection)}
                </Badge>
                <span className="min-w-0 font-semibold text-slate-700">
                  <MappedName name={item.counterpartyName} mapped={item.companyId != null} emptyLabel="거래처 미입력" />
                </span>
                <span className="shrink-0 text-slate-500">
                  {item.recordCount}건 · {item.vehicleCount}대 · {formatWeight(item.acceptedWeightKg)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
