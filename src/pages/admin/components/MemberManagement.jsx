import Pagination from "../../../components/Pagination";
import { formatDateTime, getRoleLabel, ROLES } from "../constants";
import StatusPanel from "./StatusPanel";

export default function MemberManagement({
  members,
  loading,
  error,
  totalElements,
  nameInput,
  roleInput,
  onNameChange,
  onRoleFilterChange,
  onSearch,
  onReset,
  onRoleChange,
  onDelete,
  busyId,
  pagination,
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">회원 관리</h2>
        <p className="mt-1 text-sm text-slate-500">
          가입한 회원을 검색하고 권한을 변경하거나 삭제할 수 있습니다.
        </p>
      </div>

      <form
        onSubmit={onSearch}
        className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[160px_1fr_auto]"
      >
        <select
          value={roleInput}
          onChange={(event) => onRoleFilterChange(event.target.value)}
          aria-label="회원 권한 검색"
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">모든 권한</option>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <input
          type="search"
          value={nameInput}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="회원명으로 검색"
          aria-label="회원명 검색"
          className="h-11 rounded-xl border border-slate-200 px-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReset}
            className="h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            초기화
          </button>
          <button
            type="submit"
            className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
          >
            검색
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-800">회원 목록</h3>
          <span className="text-sm text-slate-500">총 {totalElements}명</span>
        </div>

        {loading || error || members.length === 0 ? (
          <StatusPanel
            loading={loading}
            error={error}
            emptyMessage="검색 조건에 맞는 회원이 없습니다."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">회원명</th>
                  <th className="px-5 py-3">현재 권한</th>
                  <th className="px-5 py-3">가입일</th>
                  <th className="px-5 py-3 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isBusy = busyId === member.id;
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{member.name}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {member.email ?? `회원 ID ${member.id}`}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          member.role === "ADMIN"
                            ? "bg-violet-50 text-violet-700"
                            : "bg-blue-50 text-blue-700"
                        }`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(member.createdAt ?? member.joinedAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <select
                            value={member.role}
                            disabled={isBusy}
                            onChange={(event) => onRoleChange(member, event.target.value)}
                            aria-label={`${member.name} 권한 변경`}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 disabled:opacity-50"
                          >
                            {ROLES.map((role) => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => onDelete(member)}
                            className="h-9 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
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

      <Pagination {...pagination} />
    </section>
  );
}
