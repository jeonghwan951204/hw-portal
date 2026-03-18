import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "사이트 관리",   to: "/" },
  { label: "LME 구리 가격", to: "/lme" },
];

export default function Header() {
  const handleLogout = async () => {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-0 flex items-center justify-between h-14">
        {/* 로고 */}
        <span className="text-base font-bold text-blue-600 flex items-center gap-2 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          HW Portal
        </span>

        {/* 네비게이션 */}
        <nav className="flex items-center h-full">
          {NAV_ITEMS.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center h-full px-5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {/* 구분선 */}
          <span className="w-px h-5 bg-slate-200 mx-2" />

          {/* 로그아웃 */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 h-full px-4 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors border-b-2 border-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </nav>
      </div>
    </header>
  );
}
