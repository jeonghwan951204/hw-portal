import CopyableValue from "./CopyableValue";

export default function PhoneNumbers({ phoneNumbers = [], onCopy, overflow = "wrap" }) {
  if (phoneNumbers.length === 0) return <span className="text-slate-400">-</span>;

  return (
    <div className="space-y-1.5">
      {phoneNumbers.map((phone, index) => (
        <div
          key={`${phone.label}-${phone.value}-${index}`}
          className={`flex items-center gap-2 ${overflow === "truncate" ? "min-w-0" : ""}`}
        >
          <span className="min-w-14 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[10px] font-bold text-slate-500">
            {phone.label}
          </span>
          <CopyableValue label={phone.label} value={phone.value} onCopy={onCopy} overflow={overflow} />
        </div>
      ))}
    </div>
  );
}
