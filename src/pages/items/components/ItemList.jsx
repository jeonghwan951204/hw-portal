const LINE_CLASS = "absolute bg-slate-300";

// 단계별 이름 스타일. 최상위는 굵고 진하게, 깊어질수록 가볍게 해 계층이 한눈에 구분되게 한다.
const NAME_CLASS_BY_DEPTH = [
  "text-[15px] font-bold text-slate-900",
  "text-sm font-semibold text-slate-700",
  "text-sm font-medium text-slate-600",
];
const nameClassOf = (depth) => NAME_CLASS_BY_DEPTH[Math.min(depth, NAME_CLASS_BY_DEPTH.length - 1)];

// 트리 연결선. 칸 하나(w-5)가 한 단계이며, 행 높이 전체를 채워 위아래 행의 선이 끊기지 않게 이어진다.
function TreeLines({ depth, rails, isLast }) {
  if (depth === 0) return null;

  return (
    <>
      {rails.map((continues, index) => (
        <span key={index} className="relative w-5 shrink-0 self-stretch" aria-hidden="true">
          {continues && <span className={`${LINE_CLASS} inset-y-0 left-1/2 w-px`} />}
        </span>
      ))}
      <span className="relative w-5 shrink-0 self-stretch" aria-hidden="true">
        <span className={`${LINE_CLASS} left-1/2 top-0 w-px ${isLast ? "h-1/2" : "h-full"}`} />
        <span className={`${LINE_CLASS} left-1/2 top-1/2 h-px w-1/2`} />
      </span>
    </>
  );
}

// 하위 품목이 있으면 접기/펼치기 버튼, 없으면 점을 표시한다.
// 하위 품목이 보이는 중이면 가운데에서 아래로 세로선을 내려 하위 행의 연결선과 잇는다.
// 선은 버튼·점보다 먼저 그려 겹치는 부분은 버튼·점에 가려진다.
function NodeMarker({ row, collapsed, filtered, onToggleCollapse }) {
  const { item, depth, childCount, hasVisibleChildren } = row;

  return (
    <span className="relative flex w-5 shrink-0 items-center justify-center self-stretch">
      {depth > 0 && (
        <span className={`${LINE_CLASS} left-0 top-1/2 h-px w-1/2`} aria-hidden="true" />
      )}
      {hasVisibleChildren && (
        <span className={`${LINE_CLASS} bottom-0 left-1/2 top-1/2 w-px`} aria-hidden="true" />
      )}
      {childCount > 0 && !filtered ? (
        <button
          type="button"
          onClick={() => onToggleCollapse(item.id)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `${item.name} 하위 품목 펼치기` : `${item.name} 하위 품목 접기`}
          className={`relative flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            collapsed
              ? "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
              : "border-slate-300 bg-white text-slate-500 hover:bg-slate-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-3 w-3 transition-transform ${collapsed ? "-rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      ) : (
        <span
          className={`relative rounded-full ${
            childCount > 0 ? "h-2.5 w-2.5 bg-slate-400" : "h-1.5 w-1.5 bg-slate-300"
          }`}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function RowActions({ item, onAddChild, onEdit, onDeleteRequest }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onAddChild(item)}
        className="whitespace-nowrap rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
      >
        + 하위
      </button>
      <button
        type="button"
        onClick={() => onEdit(item)}
        className="whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
      >
        수정
      </button>
      <button
        type="button"
        onClick={() => onDeleteRequest(item)}
        className="whitespace-nowrap rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-bold text-red-500 transition-colors hover:bg-red-50"
      >
        삭제
      </button>
    </div>
  );
}

function ItemRow({ row, isFirst, collapsed, filtered, onToggleCollapse, actionProps }) {
  const { item, depth, childCount, matched } = row;
  const isRoot = depth === 0;

  return (
    // 최상위 품목마다 구분선과 배경을 넣어 계층 묶음 단위로 보이게 하고, 하위 행 사이에는 선을 두지 않아
    // 트리 연결선이 끊기지 않게 한다.
    <li
      className={`flex items-stretch gap-3 px-4 transition-colors hover:bg-blue-50/40 ${
        isRoot ? `bg-slate-50 ${isFirst ? "" : "border-t border-slate-200"}` : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-stretch">
        <TreeLines depth={depth} rails={row.rails} isLast={row.isLast} />
        <NodeMarker
          row={row}
          collapsed={collapsed}
          filtered={filtered}
          onToggleCollapse={onToggleCollapse}
        />
        <div className={`flex min-w-0 items-center gap-2 pl-2 ${isRoot ? "py-3" : "py-2.5"}`}>
          <span
            className={`truncate ${matched ? nameClassOf(depth) : "text-sm font-medium text-slate-400"}`}
            title={item.name}
          >
            {item.name}
          </span>
          {childCount > 0 && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                collapsed && !filtered ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
              }`}
              title={`하위 품목 ${childCount}개`}
            >
              {childCount}
            </span>
          )}
        </div>
      </div>
      <RowActions item={item} {...actionProps} />
    </li>
  );
}

export default function ItemList({
  rows,
  filtered,
  matchedCount,
  totalCount,
  collapsedIds,
  loading,
  error,
  onRetry,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onAddChild,
  onEdit,
  onDeleteRequest,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        품목 목록을 불러오는 중입니다.
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

  const actionProps = { onAddChild, onEdit, onDeleteRequest };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700">품목 목록</h2>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {filtered ? `${matchedCount} / ${totalCount}개` : `${totalCount}개`}
          </span>
        </div>
        {!filtered && totalCount > 0 && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={onExpandAll}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
            >
              모두 펼치기
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
            >
              모두 접기
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-slate-400">
          {totalCount === 0 ? "등록된 품목이 없습니다." : "검색 조건에 맞는 품목이 없습니다."}
        </p>
      ) : (
        <ul>
          {rows.map((row, index) => (
            <ItemRow
              key={row.item.id}
              row={row}
              isFirst={index === 0}
              collapsed={collapsedIds.has(String(row.item.id))}
              filtered={filtered}
              onToggleCollapse={onToggleCollapse}
              actionProps={actionProps}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
