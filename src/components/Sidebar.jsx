import { Link, useLocation } from "react-router-dom";
import { getRole } from "../utils/auth";
import { USE_MOCK } from "../utils/env";

const NAV_ITEMS = [
  {
    label: "계약",
    children: [
      { label: "LME 조회", to: "/lme" },
      { label: "계약별 조회", to: "/contract" },
    ],
  },
  {
    label: "운영",
    children: [
      { label: "거래처관리", to: "/companies" },
      { label: "품목관리", to: "/items" },
    ],
  },
  {
    label: "입출고",
    children: [
      { label: "계근조회", to: "/weighing" },
      { label: "거래관리", to: "/transactions" },
      { label: "재고관리", to: "/inventory" },
    ],
  },
];

const ADMIN_NAV_ITEM = {
  label: "관리자",
  children: [
    { label: "사이트 관리", to: "/" },
    { label: "관리자 페이지", to: "/admin" },
    { label: "메시지", to: "/admin/discord-messages" },
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
                      className={`block rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
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
