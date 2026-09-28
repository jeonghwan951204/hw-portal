import Header from "../../components/Header";
import ItemDeleteModal from "./components/ItemDeleteModal";
import ItemFormModal from "./components/ItemFormModal";
import ItemList from "./components/ItemList";
import ItemToolbar from "./components/ItemToolbar";
import { useItemList } from "./hooks/useItemList";

export default function ItemsPage() {
  const { toolbar, list, formModal, deleteModal, onCreate } = useItemList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">품목관리</h1>
            <p className="mt-1 text-sm text-slate-500">
              거래에 사용하는 품목과 별칭을 관리합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCreate()}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            품목 등록
          </button>
        </div>

        <ItemToolbar {...toolbar} />
        <ItemList {...list} />
      </main>

      <ItemFormModal {...formModal} />
      <ItemDeleteModal {...deleteModal} />
    </div>
  );
}
