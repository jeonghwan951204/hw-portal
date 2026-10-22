import { MappedName } from "../../transaction/components/Badges";
import {
  addDays,
  formatDate,
  formatKg,
  formatKgOrBlank,
  formatKoreanDate,
  ownerCompanyLabelOf,
} from "../constants";

const CELL = "border border-slate-200 px-3 py-2.5";
const NUMBER_CELL = `${CELL} text-right tabular-nums whitespace-nowrap`;

const toneOf = (value) => (Number(value) < 0 ? "font-bold text-red-600" : "");

// 셀에 마우스를 올리면 하위 품목별 내역을 보여 준다
const breakdownTitle = (entries) =>
  entries?.length > 1 || (entries?.length === 1 && entries[0].itemName)
    ? entries.map((entry) => `${entry.itemName ?? "품목 미입력"} ${formatKg(entry.quantityKg)} kg`).join("\n")
    : undefined;

function ValueCells({ row, columns, showZero = false, className = "" }) {
  const format = showZero ? formatKg : formatKgOrBlank;
  return (
    <>
      {columns.map((column) => {
        const value = row.values[column.itemId];
        return (
          <td
            key={column.itemId}
            title={breakdownTitle(row.breakdown[column.itemId])}
            className={`${NUMBER_CELL} ${toneOf(value)} ${className}`}
          >
            {format(value)}
          </td>
        );
      })}
    </>
  );
}

// 열에 잡히지 않은 거래 품목(미매핑·선택 밖 품목)은 비고로 보여 준다
function TradeNotes({ notes }) {
  if (!notes.length) return null;
  return (
    <div className="flex flex-col gap-0.5">
      {notes.map((note, index) => (
        <span key={index} className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <MappedName name={note.itemName} mapped={note.mapped} emptyLabel="품목 미입력" />
          <span className="tabular-nums">{formatKg(note.quantityKg)}</span>
        </span>
      ))}
    </div>
  );
}

function TradeSection({ label, section, columns }) {
  const columnCount = columns.length + 2;
  if (section.rows.length === 0) {
    return (
      <tr>
        <th className={`${CELL} bg-slate-50 font-bold text-slate-600`}>{label}</th>
        <td colSpan={columnCount} className={`${CELL} text-center text-xs text-slate-400`}>거래 없음</td>
      </tr>
    );
  }
  return (
    <>
      {section.rows.map((row, index) => (
        <tr key={row.key} className="hover:bg-slate-50/60">
          {index === 0 && (
            <th rowSpan={section.rows.length + 1} className={`${CELL} bg-slate-50 font-bold text-slate-600`}>
              {label}
            </th>
          )}
          <td className={`${CELL} max-w-[14rem]`}>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MappedName name={row.label} mapped={row.mapped} emptyLabel="거래처 미입력" />
              <span className="shrink-0 text-[10px] text-slate-400">{row.weighingCount}건</span>
            </span>
          </td>
          <ValueCells row={row} columns={columns} />
          <td className={CELL}><TradeNotes notes={row.notes} /></td>
        </tr>
      ))}
      <tr className="bg-slate-50 font-semibold">
        <td className={`${CELL} text-center text-slate-600`}>계</td>
        <ValueCells row={section.total} columns={columns} />
        <td className={CELL} />
      </tr>
    </>
  );
}

// 조정은 보정 건수와 관계없이 한 행 — 그날 보정분을 품목 열별로 합산해 보여 준다(내역은 보정 내역 탭에서 확인)
function AdjustmentRow({ section, columns, truncated }) {
  return (
    <tr className="hover:bg-slate-50/60">
      <th className={`${CELL} bg-slate-50 font-bold text-slate-600`}>조정</th>
      <td className={CELL} />
      <ValueCells row={section.total} columns={columns} />
      <td className={`${CELL} text-[11px] text-amber-600`}>{truncated && "보정 내역이 많아 일부만 합산했습니다."}</td>
    </tr>
  );
}

// 엑셀 '재고 현황' 양식 — 품목 열 × (전일 재고 / 매입 / 매출 / 조정 / 금일 재고) 행
export default function StockSheet({ sheet, asOfDate, ownerCompany, movementsTruncated }) {
  if (!sheet) return null;
  const { columns } = sheet;
  const hasDifference = Object.keys(sheet.differences).length > 0;
  const differenceRow = {
    values: Object.fromEntries(columns.map((column) => [column.itemId, sheet.differences[column.itemId] ?? 0])),
    breakdown: {},
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 text-center">
        <h2 className="text-lg font-bold tracking-wide text-slate-800">{formatKoreanDate(asOfDate)} 재고 현황</h2>
      </div>
      <div className="flex items-center justify-between px-5 pt-3 text-xs text-slate-500">
        <span className="font-semibold">자사: {ownerCompany ? ownerCompanyLabelOf(ownerCompany) : "전체"}</span>
        <span>단위: kg</span>
      </div>

      {columns.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">표시할 품목이 없습니다.</p>
      ) : (
        <div className="overflow-x-auto p-3">
          <table className="w-full min-w-[64rem] border-collapse text-sm text-slate-700">
            <thead className="bg-slate-100 text-[13px] text-slate-600">
              <tr>
                <th className={`${CELL} w-24`}>구분</th>
                <th className={`${CELL} w-52`}>거래처</th>
                {columns.map((column) => (
                  <th key={column.itemId} className={`${CELL} min-w-[7.5rem]`}>{column.itemName}</th>
                ))}
                <th className={`${CELL} min-w-[10rem]`}>비고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th className={`${CELL} bg-slate-50 font-bold text-slate-600`}>전일 재고</th>
                <td className={`${CELL} text-xs text-slate-500`}>{formatDate(addDays(asOfDate, -1))} 기준</td>
                <ValueCells row={sheet.opening} columns={columns} showZero />
                <td className={CELL} />
              </tr>
              <TradeSection label="매입" section={sheet.purchase} columns={columns} />
              <TradeSection label="매출" section={sheet.sale} columns={columns} />
              <AdjustmentRow section={sheet.adjustment} columns={columns} truncated={movementsTruncated} />
              <tr className="bg-blue-50/70 font-bold">
                <th className={`${CELL} text-blue-700`}>금일 재고</th>
                <td className={`${CELL} text-xs font-semibold text-blue-600`}>{formatDate(asOfDate)} 기준</td>
                <ValueCells row={sheet.closing} columns={columns} showZero />
                <td className={CELL} />
              </tr>
              {hasDifference && (
                <tr className="bg-amber-50 text-amber-800">
                  <th className={`${CELL} text-xs`}>계산 차이</th>
                  <td className={`${CELL} text-[11px]`}>금일 - (전일+매입-매출+조정)</td>
                  <ValueCells row={differenceRow} columns={columns} />
                  <td className={`${CELL} text-[11px]`}>품목 매핑 변경 등으로 생길 수 있습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
