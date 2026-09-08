import PhoneNumbers from "./PhoneNumbers";
import CopyableValue from "./CopyableValue";
import BankAccounts from "./BankAccounts";
import { COMPANY_TYPE_LABELS } from "../constants";

function LabeledValues({ values = [], fieldLabel, onCopy }) {
  if (values.length === 0) return <span className="text-slate-400">-</span>;

  return (
    <div className="space-y-1.5">
      {values.map((item, index) => (
        <div key={`${item.label}-${item.value}-${index}`} className="flex items-start gap-2">
          <span className="min-w-14 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-500">
            {item.label}
          </span>
          <CopyableValue
            label={`${item.label} ${fieldLabel}`}
            value={item.value}
            onCopy={onCopy}
            mono={false}
          />
        </div>
      ))}
    </div>
  );
}

export default function CompanyDetail({ company, onCopy }) {
  const attachments = company.attachments ?? [];

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <div>
        <p className="text-xs font-bold text-blue-600">기본정보</p>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-[1fr_0.7fr_1fr_2fr]">
          <div>
            <dt className="text-[11px] font-bold text-slate-400">회사명</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-700">
              <span>{company.name || "-"}</span>
              <span className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                {COMPANY_TYPE_LABELS[company.type] ?? company.type}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-slate-400">대표자</dt>
            <dd className="mt-0.5 text-sm text-slate-700">{company.representative || "-"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-slate-400">사업자등록번호</dt>
            <dd className="mt-0.5 text-sm">
              <CopyableValue label="사업자등록번호" value={company.businessNumber} onCopy={onCopy} />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-slate-400">계좌정보</dt>
            <dd className="mt-0.5 text-sm">
              <BankAccounts bankAccounts={company.bankAccounts} onCopy={onCopy} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 border-t border-blue-100 pt-3">
        <p className="text-xs font-bold text-blue-600">연락정보</p>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[11px] font-bold text-slate-400">전화번호</dt>
            <dd className="mt-0.5 text-sm"><PhoneNumbers phoneNumbers={company.phoneNumbers} onCopy={onCopy} /></dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold text-slate-400">이메일</dt>
            <dd className="mt-0.5">
              <LabeledValues values={company.emails} fieldLabel="이메일" onCopy={onCopy} />
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <dt className="text-[11px] font-bold text-slate-400">주소</dt>
            <dd className="mt-0.5">
              <LabeledValues values={company.addresses} fieldLabel="주소" onCopy={onCopy} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 border-t border-blue-100 pt-3">
        <p className="text-[11px] font-bold text-slate-400">메모</p>
        <p className="mt-0.5 text-sm text-slate-600">{company.memo || "-"}</p>
      </div>
      <div className="mt-3 border-t border-blue-100 pt-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-bold text-slate-400">첨부파일</p>
          <span className="text-[11px] text-slate-400">{attachments.length}개</span>
        </div>
        {attachments.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">등록된 첨부파일이 없습니다.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
            {attachments.map((file) => (
              <li key={file.id} className="inline-flex min-w-0 items-center gap-1.5 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828L18 9.828a4 4 0 10-5.657-5.657L5.757 10.757a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <a
                  href={file.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate font-semibold text-blue-600 underline decoration-blue-200 underline-offset-2"
                >
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
