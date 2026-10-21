import StatusPanel from "../../admin/components/StatusPanel";
import { formatDateTime, formatSchedule } from "../constants";
import EnabledToggle from "./EnabledToggle";

export default function MessageList({
  messages,
  loading,
  error,
  busyId,
  getDataSourceLabel,
  onEdit,
  onToggleEnabled,
  onDelete,
  onSendNow,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-800">정기 메시지</h2>
        <span className="text-sm text-slate-500">총 {messages.length}개</span>
      </div>

      {loading || error || messages.length === 0 ? (
        <StatusPanel loading={loading} error={error} emptyMessage="등록된 메시지가 없습니다." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3">이름</th>
                <th className="px-3 py-3">데이터 종류</th>
                <th className="px-3 py-3">채널</th>
                <th className="px-3 py-3">발송 요일·시각</th>
                <th className="px-3 py-3">사용</th>
                <th className="px-3 py-3">마지막 발송</th>
                <th className="px-5 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {messages.map((message) => {
                const busy = busyId === message.id;
                return (
                  <tr key={message.id} className="text-slate-700">
                    <td className="px-5 py-3 font-semibold text-slate-800">{message.name}</td>
                    <td className="px-3 py-3">{getDataSourceLabel(message.dataSource)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {message.channel}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{formatSchedule(message.sendDays, message.sendTime)}</td>
                    <td className="px-3 py-3">
                      <EnabledToggle
                        enabled={message.enabled}
                        disabled={busy}
                        onToggle={() => onToggleEnabled(message)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-slate-500">{formatDateTime(message.lastSentAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onSendNow(message)}
                          className="whitespace-nowrap rounded-lg border border-blue-100 px-2.5 py-1.5 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50 disabled:opacity-40"
                        >
                          지금 발송
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onEdit(message)}
                          className="whitespace-nowrap rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDelete(message)}
                          className="whitespace-nowrap rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
