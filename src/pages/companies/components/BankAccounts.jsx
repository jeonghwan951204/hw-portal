import CopyableValue from "./CopyableValue";

export default function BankAccounts({ bankAccounts = [], onCopy }) {
  if (bankAccounts.length === 0) return <span className="text-slate-400">-</span>;

  return (
    <div className="space-y-2">
      {bankAccounts.map((account, index) => (
        <div
          key={`${account.label}-${account.accountNumber}-${index}`}
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          <span className="min-w-12 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-500">
            {account.label}
          </span>
          <span className="text-sm font-semibold text-slate-600">{account.bankName}</span>
          <CopyableValue
            label={`${account.label} 계좌번호`}
            value={account.accountNumber}
            onCopy={onCopy}
          />
        </div>
      ))}
    </div>
  );
}
