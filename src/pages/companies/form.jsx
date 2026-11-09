import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import CompanyForm from "./components/CompanyForm";
import { useCompanyForm } from "./hooks/useCompanyForm";

export default function CompanyFormPage() {
  const companyForm = useCompanyForm();

  if (companyForm.loading) {
    return (
      <PageContainer width="form">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-400 shadow-sm">
          거래처 정보를 불러오는 중입니다.
        </div>
      </PageContainer>
    );
  }

  if (companyForm.notFound) {
    return (
      <PageContainer width="form">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <p className="text-sm text-slate-500">수정할 거래처를 찾을 수 없습니다.</p>
          <Button className="mt-4" onClick={companyForm.onCancel}>
            목록으로
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (companyForm.loadError) {
    return (
      <PageContainer width="form">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-12 text-center shadow-sm">
          <p className="text-sm text-red-600">{companyForm.loadError}</p>
          <Button className="mt-4" onClick={companyForm.onCancel}>
            목록으로
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="form">
      <PageHeader
        title={companyForm.isEdit ? "거래처 수정" : "신규 거래처 등록"}
        description={`거래처의 기본 정보와 연락·정산 정보를 ${companyForm.isEdit ? "수정" : "입력"}합니다.`}
      />
      <CompanyForm {...companyForm} />
    </PageContainer>
  );
}
