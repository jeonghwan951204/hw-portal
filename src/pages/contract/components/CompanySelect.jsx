import { useEffect, useRef, useState } from "react";

// 검색 가능한 거래처 셀렉트 — 검색 상태는 useCompanySearch 에서 받는다.
export default function CompanySelect({
  value,
  selectedName,
  onSelect,
  keyword,
  onKeywordChange,
  options = [],
  loading,
  error,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // 키보드 이동 시 활성 항목이 보이도록 스크롤
  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const openList = () => {
    setOpen(true);
    setActiveIndex(-1);
    onKeywordChange("");
  };

  const select = (company) => {
    onSelect(company);
    setOpen(false);
    onKeywordChange("");
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = options[activeIndex] ?? (options.length === 1 ? options[0] : null);
      if (target) select(target);
    } else if (e.key === "Escape") {
      setOpen(false);
      onKeywordChange("");
    }
  };

  const hasValue = value !== "" && value != null;

  return (
    <div ref={rootRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? keyword : selectedName}
        placeholder={open && hasValue ? selectedName || "거래처 검색" : "거래처 선택 (회사명·별칭 검색)"}
        onFocus={() => !open && openList()}
        onClick={() => !open && openList()}
        onChange={(e) => {
          onKeywordChange(e.target.value);
          setActiveIndex(-1);
          if (!open) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={`${className} ${hasValue ? "pr-14" : "pr-8"}`}
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
      />
      {hasValue && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => select({ id: "", name: "" })}
          className="absolute right-7 top-1/2 -translate-y-1/2 px-1 text-slate-300 hover:text-slate-500"
          aria-label="거래처 선택 해제"
        >
          ✕
        </button>
      )}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
        ▼
      </span>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">검색 중...</p>
          ) : error ? (
            <p className="px-3 py-2.5 text-sm text-red-500">{error}</p>
          ) : options.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-400">
              {keyword.trim() ? "검색 결과가 없습니다" : "등록된 거래처가 없습니다"}
            </p>
          ) : (
            <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1">
              {options.map((c, idx) => {
                const selected = String(c.id) === String(value);
                return (
                  <li
                    key={c.id}
                    role="option"
                    aria-selected={selected}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => select(c)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      idx === activeIndex ? "bg-blue-50" : ""
                    } ${selected ? "font-bold text-blue-600" : "text-slate-700"}`}
                  >
                    {c.name}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
