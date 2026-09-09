import { Fragment } from "react";
import { Link } from "react-router-dom";
import CompanyDetail from "./CompanyDetail";
import CopyableValue from "./CopyableValue";
import PhoneNumbers from "./PhoneNumbers";
import BankAccounts from "./BankAccounts";

function DetailButton({ expanded, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
    >
      상세정보
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function CompanyName({ company, typeLabelOf, overflow = "wrap" }) {
  // 목록 표에서는 거래처 구분을 회사명 위에 올려 이름이 쓸 수 있는 가로 폭을 확보한다.
  if (overflow === "truncate") {
    return (
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-blue-500">{typeLabelOf(company.type)}</p>
        <p className="truncate font-semibold text-slate-800" title={company.name}>
          {company.name}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold text-slate-800">{company.name}</span>
      <span className="shrink-0 rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
        {typeLabelOf(company.type)}
      </span>
    </div>
  );
}

function EmailAddresses({ emails = [], onCopy, overflow = "wrap" }) {
  if (emails.length === 0) return <span className="text-slate-400">-</span>;

  return (
    <div className="space-y-1.5">
      {emails.map((email, index) => (
        <div
          key={`${email.label}-${email.value}-${index}`}
          className={`flex items-center gap-2 ${overflow === "truncate" ? "min-w-0" : ""}`}
        >
          <span className="min-w-14 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-500">
            {email.label}
          </span>
          <CopyableValue
            label={`${email.label} 이메일`}
            value={email.value}
            onCopy={onCopy}
            mono={false}
            overflow={overflow}
          />
        </div>
      ))}
    </div>
  );
}

function CompanyActions({ company, expanded, onToggleDetail, onDeleteRequest }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <DetailButton expanded={expanded} onClick={() => onToggleDetail(company.id)} />
      <Link
        to={`/companies/${company.id}/edit`}
        className="text-xs font-bold text-slate-500 hover:text-blue-600"
      >
        수정
      </Link>
      <button
        type="button"
        onClick={() => onDeleteRequest(company)}
        className="text-xs font-bold text-slate-400 hover:text-red-600"
      >
        삭제
      </button>
    </div>
  );
}

export default function CompanyList({
  companies,
  typeLabelOf = (type) => type,
  totalCount,
  loading,
  error,
  searching,
  searchError,
  expandedId,
  onToggleDetail,
  onCopy,
  onRetry,
  onDeleteRequest,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center text-sm text-slate-400 shadow-sm">
        거래처 목록을 불러오는 중입니다.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-10 text-center shadow-sm">
        <p className="text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-700">거래처 목록</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {searching
            ? "검색 중..."
            : companies.length === totalCount
              ? `${totalCount}개사`
              : `${companies.length} / ${totalCount}개사`}
        </span>
      </div>

      {searchError && (
        <p className="border-b border-red-100 bg-red-50 px-5 py-2.5 text-xs font-semibold text-red-600">
          {searchError}
        </p>
      )}

      <div className="hidden overflow-x-auto md:block">
        {/* 자릿수가 고정인 사업자등록번호·전화번호·계좌번호 컬럼은 값 길이만큼 폭을 잡아 항상 전부 보여주고,
            길이가 들쭉날쭉한 회사명·이메일 컬럼만 `w-* max-w-0` 로 남은 폭을 나눠 갖고 말줄임 처리한다. */}
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="w-[22%] min-w-[8rem] max-w-0 px-4 py-3 text-left font-semibold">회사명</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">사업자등록번호</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">전화번호</th>
              <th className="w-[78%] min-w-[12rem] max-w-0 px-4 py-3 text-left font-semibold">이메일</th>
              <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">계좌정보</th>
              <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  {totalCount === 0 ? "등록된 거래처가 없습니다." : "검색 조건에 맞는 거래처가 없습니다."}
                </td>
              </tr>
            )}
            {companies.map((company) => {
              const expanded = expandedId === company.id;
              const visiblePhoneNumbers = (company.phoneNumbers ?? []).filter(
                (phone) => phone.listVisible
              );
              const visibleEmails = (company.emails ?? []).filter((email) => email.listVisible);
              return (
                <Fragment key={company.id}>
                  <tr className={expanded ? "bg-blue-50/20" : ""}>
                    <td className="max-w-0 px-4 py-4">
                      <CompanyName company={company} typeLabelOf={typeLabelOf} overflow="truncate" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <CopyableValue
                        label="사업자등록번호"
                        value={company.businessNumber}
                        onCopy={onCopy}
                        overflow="nowrap"
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <PhoneNumbers phoneNumbers={visiblePhoneNumbers} onCopy={onCopy} overflow="nowrap" />
                    </td>
                    <td className="max-w-0 px-4 py-4">
                      <EmailAddresses emails={visibleEmails} onCopy={onCopy} overflow="truncate" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <BankAccounts bankAccounts={company.bankAccounts} onCopy={onCopy} overflow="nowrap" />
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-center">
                      <CompanyActions
                        company={company}
                        expanded={expanded}
                        onToggleDetail={onToggleDetail}
                        onDeleteRequest={onDeleteRequest}
                      />
                    </td>
                  </tr>
                  {expanded && (
                    <tr>
                      <td colSpan={6} className="px-4 pb-4 pt-1">
                        <CompanyDetail company={company} typeLabelOf={typeLabelOf} onCopy={onCopy} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-100 md:hidden">
        {companies.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            {totalCount === 0 ? "등록된 거래처가 없습니다." : "검색 조건에 맞는 거래처가 없습니다."}
          </p>
        )}
        {companies.map((company) => {
          const expanded = expandedId === company.id;
          const visiblePhoneNumbers = (company.phoneNumbers ?? []).filter(
            (phone) => phone.listVisible
          );
          const visibleEmails = (company.emails ?? []).filter((email) => email.listVisible);
          return (
            <article key={company.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <CompanyName company={company} typeLabelOf={typeLabelOf} />
                <CompanyActions
                  company={company}
                  expanded={expanded}
                  onToggleDetail={onToggleDetail}
                  onDeleteRequest={onDeleteRequest}
                />
              </div>
              <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
                <dt className="text-xs font-semibold text-slate-400">사업자등록번호</dt>
                <dd><CopyableValue label="사업자등록번호" value={company.businessNumber} onCopy={onCopy} /></dd>
                <dt className="text-xs font-semibold text-slate-400">전화번호</dt>
                <dd><PhoneNumbers phoneNumbers={visiblePhoneNumbers} onCopy={onCopy} /></dd>
                <dt className="text-xs font-semibold text-slate-400">이메일</dt>
                <dd><EmailAddresses emails={visibleEmails} onCopy={onCopy} /></dd>
                <dt className="text-xs font-semibold text-slate-400">계좌정보</dt>
                <dd><BankAccounts bankAccounts={company.bankAccounts} onCopy={onCopy} /></dd>
              </dl>
              {expanded && <div className="mt-4"><CompanyDetail company={company} typeLabelOf={typeLabelOf} onCopy={onCopy} /></div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
