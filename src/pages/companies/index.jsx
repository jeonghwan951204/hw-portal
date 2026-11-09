import { Link } from "react-router-dom";
import Button from "../../components/Button";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import CompanyList from "./components/CompanyList";
import CompanyToolbar from "./components/CompanyToolbar";
import CompanyDeleteModal from "./components/CompanyDeleteModal";
import { useCompanyList } from "./hooks/useCompanyList";

export default function CompaniesPage() {
  const companyList = useCompanyList();

  return (
    <>
      <PageContainer>
        <PageHeader
          title="거래처관리"
          description="거래처의 기본 정보와 정산 정보를 확인합니다."
          actions={
            <Button as={Link} to="/companies/new">
              거래처 등록
            </Button>
          }
        />

        <CompanyToolbar {...companyList} />
        <CompanyList {...companyList} />
      </PageContainer>

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
    </>
  );
}
