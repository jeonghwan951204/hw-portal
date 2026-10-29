import Toast from "../contract/components/Toast";
import MessageBasicFields from "./components/MessageBasicFields";
import PreviewPanel from "./components/PreviewPanel";
import SettingsFields from "./components/SettingsFields";
import TemplateEditor from "./components/TemplateEditor";
import VariablePanel from "./components/VariablePanel";
import { useDiscordMessageForm } from "./hooks/useDiscordMessageForm";

function StatusCard({ message, tone = "default", onCancel }) {
  return (
    <div className="text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className={`rounded-2xl border px-5 py-12 text-center shadow-sm ${
          tone === "error" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
        }`}>
          <p className={`text-sm ${tone === "error" ? "text-red-600" : "text-slate-500"}`}>{message}</p>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              목록으로
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DiscordMessageFormPage() {
  const {
    isEdit,
    loading,
    notFound,
    loadError,
    toast,
    onCancel,
    basic,
    template,
    settings,
    variables,
    preview,
    actions,
    onSubmit,
  } = useDiscordMessageForm();

  if (loading) return <StatusCard message="메시지 정보를 불러오는 중입니다." />;
  if (notFound) return <StatusCard message="수정할 메시지를 찾을 수 없습니다." onCancel={onCancel} />;
  if (loadError) return <StatusCard message={loadError} tone="error" onCancel={onCancel} />;

  return (
    <div className="text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-800">{isEdit ? "메시지 수정" : "새 메시지"}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit ? "수정 내용은 다음 발송부터 적용됩니다." : "디스코드로 정기 발송할 메시지를 만듭니다."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <MessageBasicFields {...basic} />
            <TemplateEditor {...template} />
            <SettingsFields {...settings} />
          </div>

          <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <VariablePanel {...variables} />
            <PreviewPanel {...preview} />
          </div>

          <div className="lg:col-span-2">
            {actions.error && (
              <p className="mb-3 whitespace-pre-wrap rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{actions.error}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={actions.onCancel}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={actions.submitting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actions.submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Toast toast={toast} />
    </div>
  );
}
