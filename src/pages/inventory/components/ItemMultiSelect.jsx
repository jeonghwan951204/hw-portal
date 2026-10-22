import { useEffect, useRef, useState } from "react";

// 품목 다중 선택 — 품목 트리를 체크박스로 보여 준다. 상위·하위 품목을 함께 고를 수 있다.
export default function ItemMultiSelect({ itemOptions, selectedIds, onChange }) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = new Set(selectedIds.map(String));
  const selectedNames = itemOptions.filter((item) => selected.has(String(item.id))).map((item) => item.name);
  const summary =
    selectedIds.length === 0
      ? "전체 품목"
      : selectedNames.length > 1
        ? `${selectedNames[0]} 외 ${selectedIds.length - 1}`
        : selectedNames[0] ?? `${selectedIds.length}개 품목`;

  const normalized = keyword.trim().toLocaleLowerCase("ko-KR");
  const visible = normalized
    ? itemOptions.filter((item) => item.name.toLocaleLowerCase("ko-KR").includes(normalized))
    : itemOptions;

  const toggle = (itemId) => {
    const key = String(itemId);
    onChange(selected.has(key) ? selectedIds.filter((id) => String(id) !== key) : [...selectedIds, key]);
  };

  return (
    <div ref={ref} className="relative">
      <span className="mb-1.5 block text-xs font-semibold text-slate-500">품목</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-[38px] w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
      >
        <span className={`truncate ${selectedIds.length ? "font-semibold text-blue-600" : ""}`}>{summary}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 min-w-[16rem] rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 p-2">
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="품목명 검색"
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {visible.length === 0 && <li className="px-3 py-4 text-center text-xs text-slate-400">품목이 없습니다.</li>}
            {visible.map((item) => (
              <li key={item.id}>
                <label
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  style={{ paddingLeft: `${0.75 + (normalized ? 0 : item.depth) * 1}rem` }}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(String(item.id))}
                    onChange={() => toggle(item.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className={item.depth === 0 ? "font-semibold" : ""}>{item.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
            <span className="text-xs text-slate-400">{selectedIds.length}개 선택</span>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selectedIds.length === 0}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-40"
            >
              선택 해제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
