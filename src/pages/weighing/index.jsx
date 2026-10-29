import Pagination from "../../components/Pagination";
import WeighingList from "./components/WeighingList";
import WeighingToolbar from "./components/WeighingToolbar";
import { useWeighingList } from "./hooks/useWeighingList";

export default function WeighingPage() {
  const { toolbar, list, pagination } = useWeighingList();

  return (
    <div className="text-slate-900">
      <main className="mx-auto max-w-[100rem] space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">계근 조회</h1>
          <p className="mt-1 text-sm text-slate-500">
            계량 내역을 조회하고 행을 눌러 상세정보를 확인합니다.
          </p>
        </div>

        <WeighingToolbar {...toolbar} />
        <WeighingList {...list} />
        <Pagination {...pagination} />
      </main>
    </div>
  );
}
