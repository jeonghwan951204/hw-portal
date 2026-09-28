import { Fragment } from "react";
import WeighingDetail from "./WeighingDetail";
import { formatAmount, formatDate, formatUnitPrice, formatWeight } from "../constants";

const rowToggleProps = (weighing, expanded, onToggleDetail) => ({
  onClick: () => onToggleDetail(weighing.id),
  onKeyDown: (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggleDetail(weighing.id);
  },
  tabIndex: 0,
  "aria-expanded": expanded,
  title: "누르면 상세정보를 펼칩니다",
});

export default function WeighingList({
  weighings,
  totalCount,
  loading,
  error,
  expandedId,
  paidIds,
  onToggleDetail,
  onPaymentComplete,
  onRetry,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        계근 목록을 불러오는 중입니다.
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
        <h2 className="text-sm font-bold text-slate-700">계근 목록</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {weighings.length === totalCount
            ? `${totalCount}건`
            : `${weighings.length} / ${totalCount}건`}
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[62rem] table-fixed text-[13px]">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="w-[7%] px-2 py-2 text-center font-semibold">구분</th>
              <th className="w-[11%] px-2 py-2 text-left font-semibold">계량일자</th>
              <th className="w-[17%] px-2 py-2 text-left font-semibold">거래처</th>
              <th className="w-[9%] px-2 py-2 text-left font-semibold">품목</th>
              <th className="w-[12%] px-2 py-2 text-left font-semibold">차량번호</th>
              <th className="w-[12%] px-2 py-2 text-right font-semibold">인수량</th>
              <th className="w-[11%] px-2 py-2 text-right font-semibold">단가</th>
              <th className="w-[14%] px-2 py-2 text-right font-semibold">금액</th>
              <th className="w-[7%] px-2 py-2 text-center font-semibold">결제</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weighings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                  {totalCount === 0 ? "등록된 계근 내역이 없습니다." : "검색 조건에 맞는 계근 내역이 없습니다."}
                </td>
              </tr>
            )}
            {weighings.map((weighing) => {
              const expanded = expandedId === weighing.id;
              const paid = paidIds.has(weighing.id);
              return (
                <Fragment key={weighing.id}>
                  <tr
                    {...rowToggleProps(weighing, expanded, onToggleDetail)}
                    className={`cursor-pointer transition-colors hover:bg-blue-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
                      expanded ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-2 py-1.5 text-center">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        weighing.type === "매출"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-blue-50 text-blue-600"
                      }`}>
                        {weighing.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">{formatDate(weighing.weighedAt)}</td>
                    <td className="truncate px-2 py-1.5 font-semibold text-slate-800" title={weighing.companyName}>{weighing.companyName}</td>
                    <td className="truncate px-2 py-1.5 text-slate-600" title={weighing.itemName}>{weighing.itemName}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-slate-600">{weighing.vehicleNumber}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-slate-700">{formatWeight(weighing.receivedWeight)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono text-slate-600">{formatUnitPrice(weighing.unitPrice)}</td>
                    <td className="whitespace-nowrap px-2 py-1.5 text-right font-mono font-semibold text-slate-800">{formatAmount(weighing.amount)}</td>
                    <td className="whitespace-nowrap px-2 py-1 text-center">
                      <button
                        type="button"
                        disabled={paid}
                        onClick={(event) => {
                          event.stopPropagation();
                          onPaymentComplete(weighing.id);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        className={`rounded-md border px-2 py-1 text-[11px] font-bold transition-colors ${
                          paid
                            ? "cursor-default border-emerald-100 bg-emerald-50 text-emerald-600"
                            : "border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
                        }`}
                      >
                        {paid ? "완료" : "결제완료"}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={9} className="px-3 pb-3 pt-1">
                        <WeighingDetail weighing={weighing} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {weighings.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            {totalCount === 0 ? "등록된 계근 내역이 없습니다." : "검색 조건에 맞는 계근 내역이 없습니다."}
          </p>
        )}
        {weighings.map((weighing) => {
          const expanded = expandedId === weighing.id;
          const paid = paidIds.has(weighing.id);
          return (
            <article
              key={weighing.id}
              {...rowToggleProps(weighing, expanded, onToggleDetail)}
              className={`cursor-pointer px-4 py-3 transition-colors ${expanded ? "bg-blue-50/30" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    weighing.type === "매출"
                      ? "bg-violet-50 text-violet-600"
                      : "bg-blue-50 text-blue-600"
                  }`}>
                    {weighing.type}
                  </span>
                  <p className="min-w-0 truncate text-sm font-bold text-slate-800">{weighing.companyName}</p>
                </div>
                <p className="shrink-0 text-xs text-slate-400">{formatDate(weighing.weighedAt)}</p>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between gap-2"><dt className="text-slate-400">품목</dt><dd className="font-medium text-slate-600">{weighing.itemName}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-400">차량번호</dt><dd className="font-medium text-slate-600">{weighing.vehicleNumber}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-400">인수량</dt><dd className="font-medium text-slate-700">{formatWeight(weighing.receivedWeight)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-400">단가</dt><dd className="font-medium text-slate-600">{formatUnitPrice(weighing.unitPrice)}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-400">금액</dt><dd className="font-bold text-slate-800">{formatAmount(weighing.amount)}</dd></div>
              </dl>
              <button
                type="button"
                disabled={paid}
                onClick={(event) => {
                  event.stopPropagation();
                  onPaymentComplete(weighing.id);
                }}
                onKeyDown={(event) => event.stopPropagation()}
                className={`mt-2 w-full rounded-md border py-1.5 text-xs font-bold transition-colors ${
                  paid
                    ? "cursor-default border-emerald-100 bg-emerald-50 text-emerald-600"
                    : "border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
                }`}
              >
                {paid ? "완료" : "결제완료"}
              </button>
              {expanded && (
                <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                  <WeighingDetail weighing={weighing} />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
