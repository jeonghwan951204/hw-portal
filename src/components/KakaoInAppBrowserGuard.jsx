import { useState } from "react";

const isKakaoInAppBrowser = () => /KAKAOTALK/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);

const getAndroidBrowserIntent = () => {
  const currentUrl = new URL(window.location.href);
  const scheme = currentUrl.protocol.replace(":", "");
  const target = `${currentUrl.host}${currentUrl.pathname}${currentUrl.search}`;

  return `intent://${target}#Intent;scheme=${scheme};action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
};

export default function KakaoInAppBrowserGuard({ children }) {
  const [copied, setCopied] = useState(false);

  if (!isKakaoInAppBrowser()) return children;

  const android = isAndroid();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt("아래 주소를 길게 눌러 복사해주세요.", window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
          🌐
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          기본 브라우저에서 열어주세요
        </h1>
        <p className="text-sm leading-6 text-slate-500 mb-6">
          안전한 로그인과 원활한 이용을 위해 카카오톡 인앱 브라우저가 아닌
          휴대폰의 기본 브라우저를 사용해주세요.
        </p>

        {android && (
          <a
            href={getAndroidBrowserIntent()}
            className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            기본 브라우저로 열기
          </a>
        )}

        <div className={`${android ? "mt-5" : ""} rounded-xl bg-slate-50 px-4 py-4 text-left`}>
          <p className="text-sm font-semibold text-slate-700 mb-2">
            열리지 않는 경우
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm leading-6 text-slate-500">
            <li>카카오톡 화면의 ⋮ 또는 … 메뉴를 누릅니다.</li>
            <li>‘다른 브라우저로 열기’를 선택합니다.</li>
          </ol>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-4 text-sm font-medium text-slate-500 underline underline-offset-4"
        >
          {copied ? "링크가 복사되었습니다" : "현재 링크 복사하기"}
        </button>
      </div>
    </div>
  );
}
