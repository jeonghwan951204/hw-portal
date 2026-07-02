import Header from "../../components/Header";
import ContractList from "./components/ContractList";
import ContractCreateModal from "./components/ContractCreateModal";
import { useContractPage } from "./hooks/useContractPage";

export default function ContractPage() {
  const { list, createModal } = useContractPage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      {createModal.createModalOpen && (
        <ContractCreateModal onClose={() => createModal.setCreateModalOpen(false)} />
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <ContractList
          {...list}
          onOpenCreateModal={() => createModal.setCreateModalOpen(true)}
        />
      </main>
    </div>
  );
}
