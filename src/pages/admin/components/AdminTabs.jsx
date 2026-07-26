const TABS = [
  { value: "members", label: "회원 관리" },
  { value: "links", label: "공유링크 관리" },
];

export default function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
            activeTab === tab.value
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
