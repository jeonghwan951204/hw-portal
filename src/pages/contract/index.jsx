import { useState } from "react";
import PageContainer from "../../components/PageContainer";
import PageHeader from "../../components/PageHeader";
import Pagination from "../../components/Pagination";
import Tabs from "../../components/Tabs";
import AllTransactionsTab from "./components/AllTransactionsTab";
import MarketBanner from "./components/MarketBanner";
import ContractToolbar from "./components/ContractToolbar";
import ContractGrid from "./components/ContractGrid";
import Toast from "./components/Toast";
import { useAllTransactions } from "./hooks/useAllTransactions";
import { useContractList } from "./hooks/useContractList";

const TABS = [
  { key: "contracts", label: "계약 목록" },
  { key: "transactions", label: "전체 거래내역" },
];

// 계약 목록 화면
export default function ContractListPage() {
  const [activeTab, setActiveTab] = useState("contracts");
  const { market, toolbar, list, pagination, toast } = useContractList();
  const allTransactions = useAllTransactions(activeTab === "transactions");

  return (
    <>
      <PageContainer>
        <PageHeader title="계약별 조회" description="계약별 단가와 거래 내역을 확인합니다." />

        <MarketBanner {...market} />

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === "contracts" ? (
          <>
            <ContractToolbar {...toolbar} />
            <ContractGrid {...list} />
            <Pagination {...pagination} />
          </>
        ) : (
          <AllTransactionsTab {...allTransactions} />
        )}
      </PageContainer>

      <Toast toast={toast} />
    </>
  );
}
