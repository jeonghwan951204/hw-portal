import Header from "../../components/Header";
import WeighingList from "./components/WeighingList";
import WeighingToolbar from "./components/WeighingToolbar";
import { useWeighingList } from "./hooks/useWeighingList";

export default function WeighingPage() {
  const { toolbar, list } = useWeighingList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">계근 조회</h1>
          <p className="mt-1 text-sm text-slate-500">
            계량 내역을 조회하고 행을 눌러 상세정보를 확인합니다.
          </p>
        </div>

        <WeighingToolbar {...toolbar} />
        <WeighingList {...list} />
      </main>
    </div>
  );
}
