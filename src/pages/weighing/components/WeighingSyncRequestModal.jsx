import Button from "../../../components/Button";
import ConfirmModal from "../../../components/ConfirmModal";
import Modal from "../../../components/Modal";
import Pagination from "../../../components/Pagination";
import { formatDate } from "../constants";
import { useWeighingSyncRequests } from "../hooks/useWeighingSyncRequests";
import { formatSyncRequestResult, isSyncRequestInProgress, MAX_SYNC_REQUEST_DAYS, SYNC_SOURCE_OPTIONS } from "../utils/syncRequests";

const FIELD_CLASS = "mt-1.5 block h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20";

const STATUS_STYLES = {
  PENDING: { label: "계근 PC 대기 중", className: "bg-slate-100 text-slate-600" },
  RUNNING: { label: "처리 중", className: "bg-blue-50 text-blue-700" },
  COMPLETED: { label: "완료", className: "bg-emerald-50 text-emerald-700" },
  FAILED: { label: "실패", className: "bg-red-50 text-red-700" },
};

function SyncRequestForm({ values, today, error, inProgressMessage, canSubmit, onChange, onSubmit }) {
  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-[minmax(10rem,1fr)_1fr_1fr_auto]">
        <label className="col-span-2 text-xs font-semibold text-slate-600 md:col-span-1">
          계근 PC
          <select
            autoFocus
            required
            value={values.sourceCode}
            onChange={(event) => onChange("sourceCode", event.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">계근 PC 선택</option>
            {SYNC_SOURCE_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-xs font-semibold text-slate-600">
          시작일
          <input
            required
            type="date"
            value={values.dateFrom}
            max={values.dateTo && values.dateTo < today ? values.dateTo : today}
            onChange={(event) => onChange("dateFrom", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <label className="min-w-0 text-xs font-semibold text-slate-600">
          종료일
          <input
            required
            type="date"
            value={values.dateTo}
            min={values.dateFrom || undefined}
            max={today}
            onChange={(event) => onChange("dateTo", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>
        <Button className="col-span-2 justify-self-start md:col-span-1" type="submit" disabled={!canSubmit}>
          요청
        </Button>
      </div>
      <p className="text-xs text-slate-500">오늘까지의 계근을 최대 {MAX_SYNC_REQUEST_DAYS}일(시작일·종료일 포함) 요청할 수 있습니다.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {inProgressMessage && inProgressMessage !== error && (
        <p role="status" className="text-sm text-amber-800">{inProgressMessage}</p>
      )}
    </form>
  );
}

function SyncRequestHistory({ requests, loading, listError, actionError, pendingAction, hasInProgressForSource, onCancel, onRetry, onReload }) {
  const actionsDisabled = loading || pendingAction;

  return (
    <section className="space-y-2" aria-label="요청 이력" aria-busy={loading}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">요청 이력</h3>
        <Button variant="secondary" size="sm" disabled={actionsDisabled} onClick={onReload}>새로고침</Button>
      </div>
      {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
      {listError && <p role="alert" className="text-sm text-red-700">{listError}</p>}
      {requests.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200" tabIndex={0} role="region" aria-label="요청 이력 표">
          <table className="w-full min-w-[46rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                {["계근 PC", "기간", "상태", "요청자", "요청 시각", "결과", "작업"].map((heading) => (
                  <th key={heading} scope="col" className="whitespace-nowrap px-3 py-2.5 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 border-t border-slate-200 text-slate-700">
              {requests.map((request) => {
                const status = STATUS_STYLES[request.status];
                return (
                  <tr key={request.requestId}>
                    <td className="whitespace-nowrap px-3 py-3 font-medium">{request.sourceName}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums">
                      {formatDate(request.dateFrom)} ~ {formatDate(request.dateTo)}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{request.requestedBy}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums">
                      {request.requestedAt.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="min-w-32 px-3 py-3 text-xs break-words whitespace-pre-line">{formatSyncRequestResult(request)}</td>
                    <td className="px-3 py-3">
                      {isSyncRequestInProgress(request) && (
                        <Button size="sm" variant="dangerOutline" disabled={actionsDisabled} onClick={() => onCancel(request)}>취소</Button>
                      )}
                      {request.status === "FAILED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionsDisabled || hasInProgressForSource(request.sourceCode)}
                          onClick={() => onRetry(request)}
                        >
                          다시 요청
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !listError && <p role="status" className="rounded-xl border border-slate-200 py-8 text-center text-sm text-slate-500">
          {loading ? "요청 목록을 불러오는 중입니다." : "등록된 기간 동기화 요청이 없습니다."}
        </p>
      )}
    </section>
  );
}

export default function WeighingSyncRequestModal({ onClose }) {
  const { form, list, pagination, confirmModal, pendingAction } = useWeighingSyncRequests();

  return (
    <>
      <Modal
        size="xl"
        title="계근 기간 동기화 요청"
        description="계근 PC에 지정한 기간의 계근을 다시 보내 달라고 요청합니다."
        onClose={onClose}
        closeDisabled={pendingAction || confirmModal.open}
        bodyClassName="px-4 py-4 sm:px-6"
      >
        <div className="space-y-4" inert={confirmModal.open}>
          <SyncRequestForm {...form} />
          <SyncRequestHistory {...list} />
          {pagination.totalPages > 1 && (
            <div className="overflow-x-auto" inert={pendingAction}>
              <div className="w-max min-w-full"><Pagination {...pagination} /></div>
            </div>
          )}
        </div>
      </Modal>
      <ConfirmModal {...confirmModal} />
    </>
  );
}
