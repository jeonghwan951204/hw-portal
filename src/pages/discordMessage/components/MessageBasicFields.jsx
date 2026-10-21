import { DAYS } from "../constants";
import EnabledToggle from "./EnabledToggle";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const LABEL_CLASS = "mb-2 block text-sm font-semibold text-slate-700";

export default function MessageBasicFields({
  form,
  dataSources,
  dataSourcesLoading,
  dataSourcesError,
  selectedDataSource,
  channelOptions,
  channelsLoading,
  channelsError,
  onFieldChange,
  onDataSourceChange,
  onToggleDay,
}) {
  const hasUnknownDataSource = form.dataSource &&
    !dataSources.some((source) => source.type === form.dataSource);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-bold text-slate-800">기본 정보</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={LABEL_CLASS}>이름</span>
          <input
            type="text"
            value={form.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            placeholder="예: 진행중 계약 단가"
            className={INPUT_CLASS}
          />
        </label>

        <div className="md:col-span-2">
          <label className="block">
            <span className={LABEL_CLASS}>데이터 종류</span>
            <select
              value={form.dataSource}
              onChange={(event) => onDataSourceChange(event.target.value)}
              disabled={dataSourcesLoading || Boolean(dataSourcesError)}
              className={`${INPUT_CLASS} disabled:bg-slate-50`}
            >
              {!form.dataSource && (
                <option value="">{dataSourcesLoading ? "불러오는 중..." : "데이터 종류 선택"}</option>
              )}
              {hasUnknownDataSource && <option value={form.dataSource}>{form.dataSource}</option>}
              {dataSources.map((source) => (
                <option key={source.type} value={source.type}>{source.label}</option>
              ))}
            </select>
          </label>
          {dataSourcesError && (
            <p className="mt-2 text-xs text-red-600">{dataSourcesError}</p>
          )}
          {selectedDataSource?.description && (
            <p className="mt-2 text-xs text-slate-500">{selectedDataSource.description}</p>
          )}
        </div>

        <div>
          <label className="block">
            <span className={LABEL_CLASS}>채널</span>
            {channelsError ? (
              <input
                type="text"
                value={form.channel}
                onChange={(event) => onFieldChange("channel", event.target.value)}
                placeholder="채널 이름"
                className={INPUT_CLASS}
              />
            ) : (
              <select
                value={form.channel}
                onChange={(event) => onFieldChange("channel", event.target.value)}
                disabled={channelsLoading}
                className={`${INPUT_CLASS} disabled:bg-slate-50`}
              >
                {channelsLoading && <option value={form.channel}>불러오는 중...</option>}
                {!channelsLoading && channelOptions.map((channel) => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            )}
          </label>
          {channelsError ? (
            <p className="mt-2 text-xs text-amber-600">
              채널 목록을 불러오지 못했습니다. 채널 이름을 직접 입력해주세요.
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              원하는 채널이 없으면 백엔드 담당자에게 추가를 요청해주세요.
            </p>
          )}
        </div>

        <label className="block">
          <span className={LABEL_CLASS}>발송 시각 (한국 시간)</span>
          <input
            type="time"
            value={form.sendTime}
            onChange={(event) => onFieldChange("sendTime", event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <div>
          <span className={LABEL_CLASS}>발송 요일</span>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const checked = form.sendDays.includes(day.value);
              return (
                <label
                  key={day.value}
                  className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-colors ${
                    checked
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleDay(day.value)}
                    className="sr-only"
                  />
                  {day.label}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-400">하나 이상 선택해야 합니다.</p>
        </div>

        <div>
          <span className={LABEL_CLASS}>사용 여부</span>
          <div className="flex h-10 items-center gap-3">
            <EnabledToggle
              enabled={form.enabled}
              onToggle={() => onFieldChange("enabled", !form.enabled)}
            />
            <span className="text-sm text-slate-600">{form.enabled ? "사용" : "사용 안 함"}</span>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
        지정한 요일·시각부터 10분 안에 하루 한 번 발송됩니다. 발송 시각이 지난 뒤 새로 만들거나 시간을 바꾼 메시지는
        오늘 나가지 않고 다음 발송일에 나갑니다. 바로 확인하려면 목록에서 "지금 발송"을 사용해주세요.
      </p>
    </section>
  );
}
