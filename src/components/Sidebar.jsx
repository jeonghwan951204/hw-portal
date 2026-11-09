import { Link, useLocation } from "react-router-dom";
import { getRole } from "../utils/auth";
import { USE_MOCK } from "../utils/env";

// 메뉴 아이콘 (heroicons outline 경로)
const ICON_PATHS = {
  chart: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z",
  document: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  building: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  cube: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  scale: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  exchange: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
  archive: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  globe: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  chat: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
};

const NAV_ITEMS = [
  {
    label: "계약",
    children: [
      { label: "LME 조회", to: "/lme", icon: "chart" },
      { label: "계약별 조회", to: "/contract", icon: "document" },
    ],
  },
  {
    label: "운영",
    children: [
      { label: "거래처관리", to: "/companies", icon: "building" },
      { label: "품목관리", to: "/items", icon: "cube" },
    ],
  },
  {
    label: "입출고",
    children: [
      { label: "계근조회", to: "/weighing", icon: "scale" },
      { label: "거래관리", to: "/transactions", icon: "exchange" },
      { label: "재고관리", to: "/inventory", icon: "archive" },
    ],
  },
];

const ADMIN_NAV_ITEM = {
  label: "관리자",
  children: [
    { label: "사이트 관리", to: "/", icon: "globe" },
    { label: "관리자 페이지", to: "/admin", icon: "shield" },
    { label: "메시지", to: "/admin/discord-messages", icon: "chat" },
  ],
};

// 권한이 없는 하위 메뉴를 거르고, 남은 하위 메뉴가 없는 카테고리는 숨긴다.
const filterNavItemsByRole = (items, role) =>
  items
    .map((item) => ({ ...item, children: item.children.filter((child) => !child.roles || child.roles.includes(role)) }))
    .filter((item) => item.children.length > 0);

// 현재 경로와 가장 길게 일치하는 메뉴 하나만 활성으로 본다.
// (/admin/discord-messages 에서 "/admin" 과 "메시지" 가 함께 켜지지 않도록)
const getActiveTo = (pathname, items) =>
  items
    .flatMap((item) => item.children.map((child) => child.to))
    .filter((to) => (to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`)))
    .sort((a, b) => b.length - a.length)[0];

export function BrandLogo() {
  return (
    <span className="flex shrink-0 items-center gap-2 text-base font-bold text-blue-600">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
      HW Portal
    </span>
  );
}

// 좌측 메뉴 — 데스크톱에서는 고정 사이드바, 모바일에서는 드로어 안에 그대로 쓴다.
// 메뉴 수가 많지 않으므로 카테고리를 접지 않고 전부 펼쳐 보여 준다.
export default function Sidebar({ onNavigate, onClose }) {
  const { pathname } = useLocation();
  const role = getRole();
  const roleNavItems = filterNavItemsByRole(NAV_ITEMS, role);
  // 목업 모드에서는 RequireAuth 와 같이 권한 검사를 건너뛰고 관리자 메뉴도 보여 준다.
  const navItems = role === "ADMIN" || USE_MOCK ? [...roleNavItems, ADMIN_NAV_ITEM] : roleNavItems;
  const activeTo = getActiveTo(pathname, navItems);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-5">
        <BrandLogo />
        {onClose && (
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            className="-mr-2 rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navItems.map((item) => (
          <div key={item.label}>
            <p className="px-3 pb-2 text-xs font-semibold text-slate-400">{item.label}</p>
            <ul className="space-y-0.5">
              {item.children.map((child) => {
                const isActive = child.to === activeTo;
                return (
                  <li key={child.to}>
                    <Link
                      to={child.to}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {child.icon && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ICON_PATHS[child.icon]} />
                        </svg>
                      )}
                      {child.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
