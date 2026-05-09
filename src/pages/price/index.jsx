import Header from "../../components/Header";
import AverageCalculator from "./components/AverageCalculator";
import LmeHistorySection from "./components/LmeHistorySection.jsx";
import ExchangeModal from "./components/ExchangeModal.jsx";
import { useLmePage } from "./hooks/useLmePage";

export default function LmePage() {
  const { average, history, rateModal } = useLmePage();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      {rateModal.rateModalOpen && (
        <ExchangeModal onClose={() => rateModal.setRateModalOpen(false)} />
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <AverageCalculator {...average} />
        <LmeHistorySection
          {...history}
          onOpenRateModal={() => rateModal.setRateModalOpen(true)}
        />
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}
