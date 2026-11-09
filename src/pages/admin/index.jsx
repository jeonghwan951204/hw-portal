import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import AdminTabs from "./components/AdminTabs";
import MemberManagement from "./components/MemberManagement";
import ShareLinkManagement from "./components/ShareLinkManagement";
import { useAdminPage } from "./hooks/useAdminPage";

export default function AdminPage() {
  const { tabs, members, links } = useAdminPage();

  return (
    <PageContainer>
      <PageHeader
        title="관리자 페이지"
        description="회원과 가입용 공유링크를 한곳에서 관리합니다."
        actions={<AdminTabs {...tabs} />}
      />

      {tabs.activeTab === "members" ? (
        <MemberManagement {...members} />
      ) : (
        <ShareLinkManagement {...links} />
      )}
    </PageContainer>
  );
}
