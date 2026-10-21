import Header from "../../components/Header";
import Toast from "../contract/components/Toast";
import MessageList from "./components/MessageList";
import SendResultPanel from "./components/SendResultPanel";
import { useDiscordMessageList } from "./hooks/useDiscordMessageList";

export default function DiscordMessagePage() {
  const { toast, onCreate, list, sendResult } = useDiscordMessageList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">디스코드 메시지</h1>
            <p className="mt-1 text-sm text-slate-500">
              지정한 요일·시각부터 10분 안에 하루 한 번 발송됩니다. 수정 내용은 다음 발송부터 적용됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            새 메시지
          </button>
        </div>

        <SendResultPanel {...sendResult} />
        <MessageList {...list} />
      </main>

      <Toast toast={toast} />
    </div>
  );
}
