import Header from "../../components/Header";
import CompanyForm from "./components/CompanyForm";
import { useCompanyForm } from "./hooks/useCompanyForm";

export default function CompanyFormPage() {
  const companyForm = useCompanyForm();

  if (companyForm.loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-400 shadow-sm">
            거래처 정보를 불러오는 중입니다.
          </div>
        </main>
      </div>
    );
  }

  if (companyForm.notFound) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
            <p className="text-sm text-slate-500">수정할 거래처를 찾을 수 없습니다.</p>
            <button
              type="button"
              onClick={companyForm.onCancel}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              목록으로
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (companyForm.loadError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-12 text-center shadow-sm">
            <p className="text-sm text-red-600">{companyForm.loadError}</p>
            <button
              type="button"
              onClick={companyForm.onCancel}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              목록으로
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-800">
            {companyForm.isEdit ? "거래처 수정" : "신규 거래처 등록"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            거래처의 기본 정보와 연락·정산 정보를 {companyForm.isEdit ? "수정" : "입력"}합니다.
          </p>
        </div>
        <CompanyForm {...companyForm} />
      </main>
    </div>
  );
}
