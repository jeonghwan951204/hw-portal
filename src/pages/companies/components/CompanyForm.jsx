const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20";
const LABEL_CLASS = "mb-1.5 block text-xs font-bold text-slate-500";

function FormSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-slate-700">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function RemoveButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-lg px-2 py-2 text-xs font-bold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
    >
      삭제
    </button>
  );
}

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 rounded-lg border border-dashed border-blue-200 px-3 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
    >
      + {children}
    </button>
  );
}

function AliasFields({ items, onChange, onAdd, onRemove }) {
  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <div>
        <p className="text-xs font-bold text-slate-500">거래처 별칭</p>
        <p className="mt-1 text-xs text-slate-400">
          거래처를 구분하거나 검색할 때 사용하는 별칭입니다. 현재 서버 API의 별칭 저장 기능을
          기다리고 있습니다.
        </p>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((alias) => (
          <div key={alias.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              type="text"
              value={alias.value}
              onChange={(event) => onChange("aliases", alias.id, "value", event.target.value)}
              placeholder="거래처 별칭"
              aria-label="거래처 별칭"
              className={INPUT_CLASS}
            />
            <RemoveButton
              onClick={() => onRemove("aliases", alias.id)}
              label="거래처 별칭 삭제"
            />
          </div>
        ))}
      </div>
      <AddButton onClick={() => onAdd("aliases")}>별칭 추가</AddButton>
    </div>
  );
}

function ValueListFields({ title, description, group, items, valuePlaceholder, onChange, onAdd, onRemove }) {
  return (
    <FormSection title={title} description={description}>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[minmax(0,0.65fr)_minmax(0,1.5fr)_auto] gap-2">
            <input
              type="text"
              value={item.label}
              onChange={(event) => onChange(group, item.id, "label", event.target.value)}
              placeholder="라벨"
              aria-label={`${title} 라벨`}
              className={INPUT_CLASS}
            />
            <input
              type="text"
              value={item.value}
              onChange={(event) => onChange(group, item.id, "value", event.target.value)}
              placeholder={valuePlaceholder}
              aria-label={title}
              className={INPUT_CLASS}
            />
            <RemoveButton onClick={() => onRemove(group, item.id)} label={`${title} 삭제`} />
          </div>
        ))}
        {items.length === 0 && <p className="py-2 text-xs text-slate-400">추가된 항목이 없습니다.</p>}
      </div>
      <AddButton onClick={() => onAdd(group)}>{title} 추가</AddButton>
    </FormSection>
  );
}

function BankAccountFields({ items, onChange, onAdd, onRemove }) {
  return (
    <FormSection title="계좌정보" description="거래용, 세금용 등 계좌의 용도를 라벨로 구분합니다.">
      <div className="space-y-2">
        {items.map((account) => (
          <div key={account.id} className="grid grid-cols-1 gap-2 sm:grid-cols-[0.7fr_1fr_1.5fr_auto]">
            <input
              type="text"
              value={account.label}
              onChange={(event) => onChange("bankAccounts", account.id, "label", event.target.value)}
              placeholder="라벨"
              aria-label="계좌 라벨"
              className={INPUT_CLASS}
            />
            <input
              type="text"
              value={account.bankName}
              onChange={(event) => onChange("bankAccounts", account.id, "bankName", event.target.value)}
              placeholder="은행명"
              aria-label="은행명"
              className={INPUT_CLASS}
            />
            <input
              type="text"
              inputMode="numeric"
              value={account.accountNumber}
              onChange={(event) => onChange("bankAccounts", account.id, "accountNumber", event.target.value)}
              placeholder="계좌번호"
              aria-label="계좌번호"
              className={INPUT_CLASS}
            />
            <RemoveButton onClick={() => onRemove("bankAccounts", account.id)} label="계좌 삭제" />
          </div>
        ))}
      </div>
      <AddButton onClick={() => onAdd("bankAccounts")}>계좌 추가</AddButton>
    </FormSection>
  );
}

function AttachmentFields({ attachments, onAdd, onRemove }) {
  return (
    <FormSection title="첨부파일" description="사업자등록증과 기타 거래처 관련 파일을 선택합니다.">
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100">
        파일 선택
        <input
          type="file"
          multiple
          onChange={(event) => {
            onAdd(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </label>
      {attachments.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {attachments.map((file) => (
            <li key={file.id} className="inline-flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-blue-600 underline decoration-blue-200 underline-offset-2">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                className="font-bold text-slate-300 hover:text-red-500"
                aria-label={`${file.name} 삭제`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}

export default function CompanyForm({
  form,
  error,
  successMessage,
  submitLabel,
  submitting,
  onBasicChange,
  onItemChange,
  onItemAdd,
  onItemRemove,
  onAttachmentsAdd,
  onAttachmentRemove,
  onSubmit,
  onCancel,
}) {
  return (
    <div className="space-y-4">
      <FormSection title="기본정보">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={LABEL_CLASS}>거래처 구분</label>
            <select value={form.type} onChange={(event) => onBasicChange("type", event.target.value)} className={INPUT_CLASS}>
              <option value="PURCHASE">매입처</option>
              <option value="SALES">매출처</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>회사명 <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} onChange={(event) => onBasicChange("name", event.target.value)} placeholder="회사명" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>대표자</label>
            <input type="text" value={form.representative} onChange={(event) => onBasicChange("representative", event.target.value)} placeholder="대표자명" className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>사업자등록번호</label>
            <input type="text" inputMode="numeric" value={form.businessNumber} onChange={(event) => onBasicChange("businessNumber", event.target.value)} placeholder="000-00-00000" className={INPUT_CLASS} />
          </div>
        </div>
        <AliasFields
          items={form.aliases}
          onChange={onItemChange}
          onAdd={onItemAdd}
          onRemove={onItemRemove}
        />
      </FormSection>

      <BankAccountFields items={form.bankAccounts} onChange={onItemChange} onAdd={onItemAdd} onRemove={onItemRemove} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ValueListFields title="전화번호" description="대표전화, 팩스 등 용도를 입력합니다." group="phoneNumbers" items={form.phoneNumbers} valuePlaceholder="전화번호" onChange={onItemChange} onAdd={onItemAdd} onRemove={onItemRemove} />
        <ValueListFields title="이메일" description="세금계산서, 업무용 등 용도를 입력합니다." group="emails" items={form.emails} valuePlaceholder="이메일 주소" onChange={onItemChange} onAdd={onItemAdd} onRemove={onItemRemove} />
      </div>

      <ValueListFields title="주소" description="사업장, 우편물, 하차지 등 용도를 입력합니다." group="addresses" items={form.addresses} valuePlaceholder="주소" onChange={onItemChange} onAdd={onItemAdd} onRemove={onItemRemove} />

      <FormSection title="메모">
        <textarea
          value={form.memo}
          onChange={(event) => onBasicChange("memo", event.target.value)}
          rows={4}
          placeholder="거래처 관련 메모를 입력하세요."
          className={`${INPUT_CLASS} resize-y`}
        />
      </FormSection>

      <AttachmentFields attachments={form.attachments} onAdd={onAttachmentsAdd} onRemove={onAttachmentRemove} />

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
      {successMessage && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}

      <div className="flex justify-end gap-2 pb-8">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          취소
        </button>
        <button type="button" onClick={onSubmit} disabled={submitting} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
