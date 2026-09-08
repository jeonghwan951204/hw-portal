import Header from "../../components/Header";
import { Link } from "react-router-dom";
import CompanyList from "./components/CompanyList";
import CompanyToolbar from "./components/CompanyToolbar";
import CompanyDeleteModal from "./components/CompanyDeleteModal";
import { useCompanyList } from "./hooks/useCompanyList";

export default function CompaniesPage() {
  const companyList = useCompanyList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">거래처관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              거래처의 기본 정보와 정산 정보를 확인합니다.
            </p>
          </div>
          <Link
            to="/companies/new"
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            거래처 등록
          </Link>
        </div>

        <CompanyToolbar {...companyList} />
        <CompanyList {...companyList} />
      </main>

      {companyList.copyMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          {companyList.copyMessage}
        </div>
      )}
      <CompanyDeleteModal
        company={companyList.deleteTarget}
        deleting={companyList.deleting}
        error={companyList.deleteError}
        onConfirm={companyList.onDeleteConfirm}
        onCancel={companyList.onDeleteCancel}
      />
    </div>
  );
}
