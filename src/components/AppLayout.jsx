import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar, { BrandLogo } from "./Sidebar";

// 로그인 후 화면 공통 레이아웃 — 좌측 사이드바 + 본문.
// md 미만(모바일)에서는 사이드바 대신 상단 바의 햄버거 버튼으로 드로어를 연다.
export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 데스크톱 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-slate-200 bg-white md:block">
        <Sidebar />
      </aside>

      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white px-3 md:hidden">
        <button
          type="button"
          aria-label="메뉴 열기"
          onClick={() => setMobileOpen(true)}
          className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <BrandLogo />
      </header>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={closeMobile} />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[80%] bg-white shadow-xl">
            <Sidebar onNavigate={closeMobile} onClose={closeMobile} />
          </aside>
        </div>
      )}

      <div className="md:pl-60">
        <Outlet />
      </div>
    </div>
  );
}
