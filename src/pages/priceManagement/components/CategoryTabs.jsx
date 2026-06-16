import { CATEGORY_ITEMS } from "../constants";

/** 카테고리 탭 버튼 */
export default function CategoryTabs({ current, onChange }) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
      {Object.entries(CATEGORY_ITEMS).map(([key, cat]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all ${
            current === key
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
