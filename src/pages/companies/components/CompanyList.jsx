import { Fragment } from "react";
import { Link } from "react-router-dom";
import CompanyDetail from "./CompanyDetail";
import CopyableValue from "./CopyableValue";
import PhoneNumbers from "./PhoneNumbers";
import BankAccounts from "./BankAccounts";
import { COMPANY_TYPE_LABELS } from "../constants";

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

function CompanyName({ company }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold text-slate-800">{company.name}</span>
      <span className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
        {COMPANY_TYPE_LABELS[company.type] ?? company.type}
      </span>
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
  totalCount,
  expandedId,
  onToggleDetail,
  onCopy,
  onDeleteRequest,
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-700">거래처 목록</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
          {companies.length === totalCount ? `${totalCount}개사` : `${companies.length} / ${totalCount}개사`}
        </span>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">회사명</th>
              <th className="px-4 py-3 text-left font-semibold">사업자등록번호</th>
              <th className="px-4 py-3 text-left font-semibold">전화번호</th>
              <th className="px-4 py-3 text-left font-semibold">계좌정보</th>
              <th className="px-4 py-3 text-center font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  {totalCount === 0 ? "등록된 거래처가 없습니다." : "검색 조건에 맞는 거래처가 없습니다."}
                </td>
              </tr>
            )}
            {companies.map((company) => {
              const expanded = expandedId === company.id;
              return (
                <Fragment key={company.id}>
                  <tr className={expanded ? "bg-blue-50/20" : ""}>
                    <td className="px-4 py-4"><CompanyName company={company} /></td>
                    <td className="px-4 py-4">
                      <CopyableValue label="사업자등록번호" value={company.businessNumber} onCopy={onCopy} />
                    </td>
                    <td className="px-4 py-4"><PhoneNumbers phoneNumbers={company.phoneNumbers} onCopy={onCopy} /></td>
                    <td className="px-4 py-4">
                      <BankAccounts bankAccounts={company.bankAccounts} onCopy={onCopy} />
                    </td>
                    <td className="px-4 py-4 text-center">
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
                      <td colSpan={5} className="px-4 pb-4 pt-1">
                        <CompanyDetail company={company} onCopy={onCopy} />
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
          return (
            <article key={company.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <CompanyName company={company} />
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
                <dd><PhoneNumbers phoneNumbers={company.phoneNumbers} onCopy={onCopy} /></dd>
                <dt className="text-xs font-semibold text-slate-400">계좌정보</dt>
                <dd><BankAccounts bankAccounts={company.bankAccounts} onCopy={onCopy} /></dd>
              </dl>
              {expanded && <div className="mt-4"><CompanyDetail company={company} onCopy={onCopy} /></div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
