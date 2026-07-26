import Header from "../../components/Header";
import AdminTabs from "./components/AdminTabs";
import MemberManagement from "./components/MemberManagement";
import ShareLinkManagement from "./components/ShareLinkManagement";
import { useAdminPage } from "./hooks/useAdminPage";

export default function AdminPage() {
  const { tabs, members, links } = useAdminPage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold text-blue-600">ADMIN CONSOLE</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">관리자 페이지</h1>
            <p className="mt-1 text-sm text-slate-500">회원과 가입용 공유링크를 한곳에서 관리합니다.</p>
          </div>
          <AdminTabs {...tabs} />
        </div>

        {tabs.activeTab === "members" ? (
          <MemberManagement {...members} />
        ) : (
          <ShareLinkManagement {...links} />
        )}
      </main>
    </div>
  );
}
