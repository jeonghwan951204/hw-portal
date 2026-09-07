import Header from "../../components/Header";
import CompanyForm from "./components/CompanyForm";
import { useCompanyForm } from "./hooks/useCompanyForm";

export default function CompanyFormPage() {
  const companyForm = useCompanyForm();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-800">신규 거래처 등록</h1>
          <p className="mt-1 text-sm text-slate-500">거래처의 기본 정보와 연락·정산 정보를 입력합니다.</p>
        </div>
        <CompanyForm {...companyForm} />
      </main>
    </div>
  );
}
