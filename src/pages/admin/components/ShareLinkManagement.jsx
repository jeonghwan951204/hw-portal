import Pagination from "../../../components/Pagination";
import { formatDateTime, getRoleLabel, ROLES } from "../constants";
import StatusPanel from "./StatusPanel";

export default function ShareLinkManagement({
  shareLinks,
  loading,
  error,
  totalElements,
  form,
  submitting,
  createdLink,
  copyMessage,
  minimumExpiry,
  onFormChange,
  onCreate,
  onCopy,
  getShareUrl,
  pagination,
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">공유링크 관리</h2>
        <p className="mt-1 text-sm text-slate-500">
          가입 후 이동할 경로와 회원 권한, 링크 만료기한을 지정합니다.
        </p>
      </div>

      <form onSubmit={onCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800">새 공유링크</h3>
            <p className="mt-1 text-xs text-slate-400">생성된 링크는 만료기한 전까지 가입에 사용할 수 있습니다.</p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">관리자 전용</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">가입 후 접속 경로</span>
            <input
              type="text"
              value={form.path}
              onChange={(event) => onFormChange("path", event.target.value)}
              placeholder="/contract"
              required
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">가입 회원 권한</span>
            <select
              value={form.role}
              onChange={(event) => onFormChange("role", event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">만료기한</span>
            <input
              type="datetime-local"
              value={form.expiredDt}
              min={minimumExpiry}
              onChange={(event) => onFormChange("expiredDt", event.target.value)}
              required
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "생성 중..." : "링크 생성"}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {createdLink && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-700">공유링크가 생성되었습니다</p>
              <input
                readOnly
                value={createdLink}
                onFocus={(event) => event.target.select()}
                aria-label="생성된 공유링크"
                className="mt-1 w-full bg-transparent text-sm text-emerald-900 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => onCopy(createdLink)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
            >
              복사
            </button>
          </div>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-800">생성된 공유링크</h3>
          <span className="text-sm text-slate-500">총 {totalElements}개</span>
        </div>

        {loading || error || shareLinks.length === 0 ? (
          <StatusPanel
            loading={loading}
            error={error}
            emptyMessage="생성된 공유링크가 없습니다."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {shareLinks.map((link) => {
              const url = getShareUrl(link);
              const expired = link.expired === true ||
                (link.expiredDt && new Date(link.expiredDt).getTime() < Date.now());

              return (
                <div key={link.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.5fr_0.8fr_1fr_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{url || "-"}</p>
                    <p className="mt-1 text-xs text-slate-400">접속 경로 {link.path ?? "/"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">가입 권한</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{getRoleLabel(link.role)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">만료기한</p>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-sm text-slate-700">{formatDateTime(link.expiredDt)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        expired ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {expired ? "만료" : "사용 가능"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!url}
                    onClick={() => onCopy(url)}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    링크 복사
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {copyMessage && (
        <div role="status" className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          {copyMessage}
        </div>
      )}

      <Pagination {...pagination} />
    </section>
  );
}
