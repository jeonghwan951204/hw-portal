// 화면 상단 탭(세그먼트 버튼) — tabs: [{ key, label }]
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-1.5">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`h-9 rounded-lg border px-4 text-sm font-semibold transition-colors ${
              isActive
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
